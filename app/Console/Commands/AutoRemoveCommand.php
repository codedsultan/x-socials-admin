<?php

namespace App\Console\Commands;

use App\Models\ModerationQueue;
use App\Services\XSocialsApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoRemoveCommand extends Command
{
    protected $signature = 'moderation:auto-remove
                            {--dry-run : Preview which items would be removed without deleting them}
                            {--threshold= : Override AUTO_ENFORCE_THRESHOLD for this run}';

    protected $description = 'Auto-remove posts and comments flagged above the platform tolerance threshold';

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
            $this->warn("DRY RUN — no content will be deleted (threshold={$threshold})");
        }

        $items = ModerationQueue::query()
            ->where('status', 'pending')
            ->where('verdict', 'remove')
            ->where('confidence_pct', '>=', (int) round($threshold * 100))
            ->orderBy('confidence_pct', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();

        if ($items->isEmpty()) {
            $this->info("No items above threshold ({$threshold}). Nothing to do.");

            return Command::SUCCESS;
        }

        $this->info("Found {$items->count()} item(s) to auto-remove (threshold={$threshold})");

        $removed = 0;
        $failed = 0;
        $skipped = 0;

        foreach ($items as $item) {
            if ($dryRun) {
                $this->line(sprintf(
                    '  WOULD REMOVE  type=%-8s  id=%s  confidence=%.0f%%',
                    $item->content_type,
                    $item->content_id,
                    $item->confidence_pct,
                ));
                $skipped++;

                continue;
            }

            // [Fix 2] Branch on content_type — mirrors QueueController::remove().
            // Post-type items use deletePost() against /admin/posts/{id}.
            // Comment-type items use deleteComment() against /admin/comments/{id}.
            // The original always called deleteComment($item->comment_id), which
            // is NULL for post queue items, producing a 404 that was silently
            // logged as a warning and then incorrectly marked auto_removed.
            $deleted = $item->isPost()
                ? $this->api->deletePost($item->content_id)
                : $this->api->deleteComment($item->content_id);

            if (! $deleted) {
                Log::warning('AutoRemove: Node.js delete failed', [
                    'content_type' => $item->content_type,
                    'content_id' => $item->content_id,
                    'confidence_pct' => $item->confidence_pct,
                ]);
                $failed++;
            }

            // Always update queue + audit log even on API failure:
            // the content is likely already gone (404) or the admin can
            // investigate via the audit log's api_success=false field.
            $item->update([
                'status' => 'auto_removed',
                'resolved_at' => now(),
                'resolved_by' => null,
                'resolution_note' => sprintf(
                    'Auto-removed by scheduler: confidence=%.0f%%, threshold=%.0f%%',
                    $item->confidence_pct,
                    $threshold * 100
                ),
            ]);

            // actor_id=0 signals the system — raw insert avoids FK constraint
            // on admin_users.id=0.
            DB::table('admin_action_logs')->insert([
                'actor_id' => 0,
                'actor_email' => 'system@auto-moderator',
                'actor_name' => 'Auto-Moderator',
                'action' => 'auto_remove',
                'target_type' => $item->content_type,   // [Fix 2] 'post' or 'comment'
                'target_id' => $item->content_id,     // [Fix 2] always the right ID
                'meta' => json_encode([
                    'content_type' => $item->content_type,
                    'confidence_pct' => $item->confidence_pct,
                    'threshold_pct' => (int) round($threshold * 100),
                    'verdict' => 'remove',
                    'explanation' => $item->explanation,
                    'api_success' => $deleted,
                ]),
                'ip' => null,
                'created_at' => now(),
            ]);

            if ($deleted) {
                $removed++;
                $this->line(sprintf(
                    '  Removed  type=%-8s  id=%s  confidence=%.0f%%',
                    $item->content_type,
                    $item->content_id,
                    $item->confidence_pct,
                ));
            }
        }

        if ($dryRun) {
            $this->warn("DRY RUN complete — {$skipped} item(s) would have been removed.");
        } else {
            $this->info("Done — {$removed} removed, {$failed} failed (check logs).");
            Log::info('AutoRemove completed', [
                'threshold' => $threshold,
                'removed' => $removed,
                'failed' => $failed,
            ]);
        }

        return Command::SUCCESS;
    }
}
