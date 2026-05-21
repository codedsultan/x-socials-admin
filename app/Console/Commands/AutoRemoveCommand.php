<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\AdminAction;
use App\Enums\ModerationVerdict;
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

        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->warn("DRY RUN — no content will be deleted (threshold={$threshold})");
        }

        $items = ModerationQueue::query()
            ->pending()
            ->byVerdict(ModerationVerdict::Remove)
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
                    $item->content_type->value,
                    $item->content_id,
                    $item->confidence_pct,
                ));
                $skipped++;

                continue;
            }

            $deleted = $item->isPost()
                ? $this->api->deletePost($item->content_id)
                : $this->api->deleteComment($item->content_id);

            if (! $deleted) {
                Log::warning('AutoRemove: Node.js delete failed', [
                    'content_type' => $item->content_type->value,
                    'content_id' => $item->content_id,
                    'confidence_pct' => $item->confidence_pct,
                ]);
                $failed++;
            }

            $item->autoRemove(sprintf(
                'Auto-removed by scheduler: confidence=%.0f%%, threshold=%.0f%%',
                $item->confidence_pct,
                $threshold * 100
            ));

            // actor_id=0 signals the system — raw insert avoids FK constraint on admin_users.id=0
            DB::table('admin_action_logs')->insert([
                'actor_id' => 0,
                'actor_email' => 'system@auto-moderator',
                'actor_name' => 'Auto-Moderator',
                'action' => AdminAction::AutoRemove->value,
                'target_type' => $item->content_type->value,
                'target_id' => $item->content_id,
                'meta' => json_encode([
                    'content_type' => $item->content_type->value,
                    'confidence_pct' => $item->confidence_pct,
                    'threshold_pct' => (int) round($threshold * 100),
                    'verdict' => ModerationVerdict::Remove->value,
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
                    $item->content_type->value,
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
