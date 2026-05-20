<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\ScanRun;

/**
 * ModerationScanCommand
 *
 * Triggers a full platform scan by calling POST /scan/trigger on the FastAPI
 * moderator service. The FastAPI service reads comments from MongoDB directly
 * and writes results to this database — no HTTP loop through the Node.js API.
 *
 * Usage:
 *   php artisan moderation:scan                         — full scan
 *   php artisan moderation:scan --post=<postId>         — single post
 *   php artisan moderation:scan --model=claude-sonnet-4-20250514  — override model
 */
class ModerationScanCommand extends Command
{
    protected $signature = 'moderation:scan
                            {--post= : Scope the scan to a single post ID}
                            {--model= : Override Claude model for this run}';

    protected $description = 'Trigger a moderation scan via FastAPI (reads MongoDB, writes to this DB)';

    public function handle(): int
    {
        $postId = $this->option('post');
        $model  = $this->option('model');

        $scope = $postId ? "post {$postId}" : "full platform";
        $this->info("Triggering moderation scan ({$scope})…");

        $payload = array_filter([
            'post_id'     => $postId,
            'force_model' => $model,
        ]);

        try {
            $response = Http::timeout(30)
                ->baseUrl(config('services.moderator.url', 'http://localhost:8001'))
                ->post('/scan/trigger', empty($payload) ? new \stdClass() : $payload);

            if ($response->failed()) {
                $this->error("FastAPI returned {$response->status()}: " . $response->body());
                return Command::FAILURE;
            }

            $data = $response->json();
            $this->info("Scan started — run_id={$data['scan_run_id']}");
            $this->line("The scan is running in the background on the FastAPI service.");
            $this->line("Check the dashboard or: php artisan moderation:status {$data['scan_run_id']}");

            return Command::SUCCESS;

        } catch (\Throwable $e) {
            $this->error("Could not reach FastAPI moderator: {$e->getMessage()}");
            $this->warn("Is the moderator running? Check MODERATOR_URL in .env");
            return Command::FAILURE;
        }
    }
}
