<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ModerationScanService;

class ModerationScanCommand extends Command
{
    protected $signature   = 'moderation:scan {--dry-run : Fetch and analyse but do not write to DB}';
    protected $description = 'Run a full automated moderation scan of recent comments';

    public function handle(ModerationScanService $scanner): int
    {
        $this->info('Starting moderation scan…');

        if ($this->option('dry-run')) {
            $this->warn('DRY RUN — no records will be written');
        }

        $run = $scanner->scan();

        if ($run->status === 'completed') {
            $this->table(
                ['Metric', 'Count'],
                [
                    ['Posts scanned',      $run->posts_scanned],
                    ['Comments scanned',   $run->comments_scanned],
                    ['Safe',               $run->safe],
                    ['Queued for review',  $run->queued_for_review],
                    ['Flagged (remove)',   $run->flagged],
                    ['Duration (s)',       $run->durationSeconds() ?? '—'],
                ]
            );
            $this->info('Scan completed.');
            return Command::SUCCESS;
        }

        $this->error('Scan failed: ' . ($run->error_message ?? 'unknown error'));
        return Command::FAILURE;
    }
}
