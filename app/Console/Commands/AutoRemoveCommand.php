<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ModerationQueue;
use App\Models\AdminActionLog;
use App\Services\XSocialsApiService;
use Illuminate\Support\Facades\Log;

/**
 * AutoRemoveCommand
 *
 * Runs every 5 minutes. Finds queue items with verdict='remove' and
 * confidence above the platform's automatic enforcement threshold, then
 * deletes them from the Node.js API immediately without waiting for human review.
 *
 * Design rationale — pessimistic enforcement:
 *   High-confidence violations (e.g. explicit hate speech, self-harm promotion)
 *   should not remain visible on the frontend while waiting for a human admin
 *   to get online. The AI verdict at threshold >= AUTO_ENFORCE_THRESHOLD is
 *   treated as sufficient grounds to remove immediately.
 *
 *   Humans can still review the action in the audit log and the queue
 *   (status='auto_removed') and can manually restore content if the AI was wrong.
 *   The moderation_records table retains the full AI explanation.
 *
 * Threshold:
 *   AUTO_ENFORCE_THRESHOLD (default 0.95) — stricter than the 'remove' threshold
 *   (0.85) so that borderline 'remove' verdicts still go to human review.
 *   Only very high confidence violations are auto-enforced.
 *   Configure in .env: AUTO_ENFORCE_THRESHOLD=0.95
 *
 * Audit trail:
 *   Every auto-removal is logged in admin_action_logs with action='auto_remove'
 *   and actor_id=0 (system actor). The log entry records the confidence_pct
 *   and categories so reviewers can evaluate the decision.
 *
 * Usage:
 *   php artisan moderation:auto-remove          — run once
 *   php artisan moderation:auto-remove --dry-run — preview without deleting
 */
class AutoRemoveCommand extends Command
{
    protected $signature = 'moderation:auto-remove
                            {--dry-run : Preview which comments would be removed without deleting them}
                            {--threshold= : Override AUTO_ENFORCE_THRESHOLD for this run}';

    protected $description = 'Auto-remove comments flagged above the platform tolerance threshold';

    public function __construct(private readonly XSocialsApiService $api)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $threshold = (float) ($this->option('threshold')
            ?? config('services.moderation.auto_enforce_threshold', 0.95));

        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn("DRY RUN — no comments will be deleted (threshold={$threshold})");
        }

        // Fetch pending 'remove' items above the enforcement threshold
        $items = ModerationQueue::query()
            ->where('status',       'pending')
            ->where('verdict',      'remove')
            ->where('confidence_pct', '>=', (int) round($threshold * 100))
            ->orderBy('confidence_pct', 'desc')   // highest confidence first
            ->orderBy('created_at',     'asc')    // oldest unresolved first
            ->get();

        if ($items->isEmpty()) {
            $this->info("No comments above threshold ({$threshold}). Nothing to do.");
            return Command::SUCCESS;
        }

        $this->info("Found {$items->count()} comment(s) to auto-remove (threshold={$threshold})");

        $removed  = 0;
        $failed   = 0;
        $skipped  = 0;

        foreach ($items as $item) {
            $pct = $item->confidence_pct / 100;

            if ($dryRun) {
                $this->line(sprintf(
                    "  WOULD REMOVE  comment=%s  confidence=%.0f%%  categories=%s",
                    $item->comment_id,
                    $item->confidence_pct,
                    implode(', ', json_decode($item->flagged_phrases ?? '[]', true) ?: ['—'])
                ));
                $skipped++;
                continue;
            }

            $deleted = $this->api->deleteComment($item->comment_id);

            if (!$deleted) {
                // Node.js returned an error — comment may already be deleted or
                // the API is down. Mark as auto_removed anyway to prevent
                // repeated attempts; log the failure for investigation.
                Log::warning('AutoRemove: Node.js delete failed', [
                    'comment_id'     => $item->comment_id,
                    'confidence_pct' => $item->confidence_pct,
                ]);
                $failed++;
            }

            // Always update the queue and audit log, even if the API call
            // failed — the comment is likely already gone (404) or the admin
            // can investigate via the audit log.
            $item->update([
                'status'          => 'auto_removed',
                'resolved_at'     => now(),
                'resolved_by'     => null,      // system actor, not a human
                'resolution_note' => sprintf(
                    'Auto-removed by scheduler: confidence=%.0f%%, threshold=%.0f%%',
                    $item->confidence_pct,
                    $threshold * 100
                ),
            ]);

            // Audit log — actor_id=0 signals the system, not a human admin.
            // We use a raw insert to avoid FK constraint on admin_users.id=0.
            \Illuminate\Support\Facades\DB::table('admin_action_logs')->insert([
                'actor_id'    => 0,
                'actor_email' => 'system@auto-moderator',
                'actor_name'  => 'Auto-Moderator',
                'action'      => 'auto_remove',
                'target_type' => 'comment',
                'target_id'   => $item->comment_id,
                'meta'        => json_encode([
                    'confidence_pct'  => $item->confidence_pct,
                    'threshold_pct'   => (int) round($threshold * 100),
                    'verdict'         => 'remove',
                    'explanation'     => $item->explanation,
                    'api_success'     => $deleted,
                ]),
                'ip'          => null,
                'created_at'  => now(),
            ]);

            if ($deleted) {
                $removed++;
                $this->line(sprintf(
                    "  Removed  comment=%s  confidence=%.0f%%",
                    $item->comment_id,
                    $item->confidence_pct
                ));
            }
        }

        if ($dryRun) {
            $this->warn("DRY RUN complete — {$skipped} comment(s) would have been removed.");
        } else {
            $this->info("Done — {$removed} removed, {$failed} failed (check logs).");
            Log::info('AutoRemove completed', [
                'threshold' => $threshold,
                'removed'   => $removed,
                'failed'    => $failed,
            ]);
        }

        return Command::SUCCESS;
    }
}
