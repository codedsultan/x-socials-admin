<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Calls the FastAPI AI moderation service.
 *
 * The moderator service exposes two endpoints:
 *   POST /moderate       — analyse a single comment
 *   POST /moderate/batch — analyse multiple comments at once
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
     *
     * @return array{
     *   id: string,
     *   verdict: 'safe'|'review'|'remove',
     *   confidence: float,
     *   categories: array<string>,
     *   explanation: string,
     *   flaggedPhrases: array<string>
     * }
     */
    public function moderate(string $commentId, string $content, string $authorId = ''): array
    {
        $response = Http::timeout(30)
            ->baseUrl($this->baseUrl)
            ->post('/moderate', [
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
     *
     * @param  array<array{id: string, content: string, authorId?: string}>  $comments
     * @return array<array{id: string, verdict: string, ...}>
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
