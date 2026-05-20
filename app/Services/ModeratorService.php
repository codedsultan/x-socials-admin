<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * ModeratorService
 *
 * Calls the FastAPI AI moderation service.
 *
 * Three modes:
 *   moderate()       — single comment, on-demand, result returned to caller (no DB write)
 *   moderateBatch()  — up to 50 comments, on-demand, result returned to caller (no DB write)
 *   triggerScan()    — background scan, FastAPI reads MongoDB and writes to our DB
 */
class ModeratorService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.moderator.url', 'http://localhost:8001'), '/');
    }

    /**
     * Analyse a single comment and return moderation metadata.
     * Result is returned to the caller — nothing is written to the database.
     * Use this for the admin modal preview.
     *
     * @param  string|null  $forceModel  e.g. 'claude-sonnet-4-20250514' for re-analysis
     */
    public function moderate(string $commentId, string $content, string $authorId = '', ?string $forceModel = null): array
    {
        $url = '/moderate' . ($forceModel ? '?force_model=' . urlencode($forceModel) : '');

        $response = Http::timeout(30)
            ->baseUrl($this->baseUrl)
            ->post($url, [
                'id'       => $commentId,
                'content'  => $content,
                'authorId' => $authorId,
            ]);

        if ($response->failed()) {
            return $this->errorResult($commentId, 'Moderation service unavailable');
        }

        return $response->json();
    }

    /**
     * Analyse multiple comments in a single round-trip.
     * Result is returned to the caller — nothing is written to the database.
     * Use this for the Moderation/Index page preview.
     *
     * @param  array<array{id: string, content: string, authorId?: string}>  $comments
     */
    public function moderateBatch(array $comments): array
    {
        $response = Http::timeout(60)
            ->baseUrl($this->baseUrl)
            ->post('/moderate/batch', ['comments' => $comments]);

        if ($response->failed()) {
            return array_map(
                fn($c) => $this->errorResult($c['id'], 'Moderation service unavailable'),
                $comments
            );
        }

        return $response->json()['results'] ?? [];
    }

    /**
     * Trigger a background scan on the FastAPI service.
     *
     * FastAPI reads comments directly from MongoDB, analyses them with Claude,
     * and writes results to moderation_records and moderation_queue in our database.
     * This method returns as soon as FastAPI confirms the scan has started.
     *
     * @param  string|null  $postId      Scope to a single post; null = full platform scan
     * @param  string|null  $forceModel  Override Claude model for this run
     * @return array{ started: bool, scan_run_id: int|null, message: string }
     */
    public function triggerScan(?string $postId = null, ?string $forceModel = null): array
    {
        $payload = array_filter([
            'post_id'     => $postId,
            'force_model' => $forceModel,
        ]);

        $response = Http::timeout(30)
            ->baseUrl($this->baseUrl)
            ->post('/scan/trigger', empty($payload) ? new \stdClass() : $payload);

        if ($response->failed()) {
            return [
                'started'     => false,
                'scan_run_id' => null,
                'message'     => 'Moderator service unavailable: ' . $response->status(),
            ];
        }

        return $response->json();
    }

    private function errorResult(string $id, string $reason): array
    {
        return [
            'id'             => $id,
            'verdict'        => 'review',
            'confidence'     => 0.0,
            'categories'     => [],
            'explanation'    => $reason,
            'flaggedPhrases' => [],
            'error'          => true,
        ];
    }
}

