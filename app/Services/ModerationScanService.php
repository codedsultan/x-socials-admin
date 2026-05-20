<?php

namespace App\Services;

use App\Models\ModerationRecord;
use App\Models\ModerationQueue;
use App\Models\ScanRun;
use Illuminate\Support\Facades\Log;

/**
 * ModerationScanService
 *
 * Orchestrates the automatic background moderation pipeline:
 *
 *   1. Fetch recent posts from the x-socials Node API
 *   2. Fetch comments for each post (only ones not yet analysed)
 *   3. Send comments in batches to the FastAPI AI moderator
 *   4. Store every verdict in moderation_records (append-only)
 *   5. Push 'review' and 'remove' verdicts into moderation_queue
 *
 * Humans only need to act on items in the queue.
 * Safe comments are recorded but never surface in the review UI.
 *
 * Usage:
 *   app(ModerationScanService::class)->scan();   // called by the artisan command
 */
class ModerationScanService
{
    private const BATCH_SIZE    = 20;  // comments per AI batch call
    private const POSTS_PER_RUN = 50;  // max posts to scan per run

    public function __construct(
        private readonly XSocialsApiService $api,
        private readonly ModeratorService   $moderator,
    ) {}

    /**
     * Run a full scan. Returns the ScanRun record.
     */
    public function scan(): ScanRun
    {
        $run = ScanRun::create(['status' => 'running', 'started_at' => now()]);

        $counts = [
            'posts_scanned'      => 0,
            'comments_scanned'   => 0,
            'flagged'            => 0,
            'queued_for_review'  => 0,
            'safe'               => 0,
        ];

        try {
            $posts = $this->fetchRecentPosts();
            $counts['posts_scanned'] = count($posts);

            foreach ($posts as $post) {
                $stats = $this->scanPost($post, $run);
                $counts['comments_scanned']  += $stats['scanned'];
                $counts['flagged']           += $stats['flagged'];
                $counts['queued_for_review'] += $stats['review'];
                $counts['safe']              += $stats['safe'];
            }

            $run->markCompleted($counts);
            Log::info('ModerationScan completed', $counts);

        } catch (\Throwable $e) {
            $run->markFailed($e->getMessage());
            Log::error('ModerationScan failed', ['error' => $e->getMessage()]);
        }

        return $run->fresh();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Fetch the N most recent posts from the Node API */
    private function fetchRecentPosts(): array
    {
        try {
            $data = $this->api->getPosts(1, self::POSTS_PER_RUN);
            return $data['items'] ?? [];
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Scan all un-analysed comments on a single post.
     * Returns counts: ['scanned', 'flagged', 'review', 'safe'].
     */
    private function scanPost(array $post, ScanRun $run): array
    {
        $counts = ['scanned' => 0, 'flagged' => 0, 'review' => 0, 'safe' => 0];

        // Paginate through all comments on this post
        $after = null;
        do {
            try {
                $page     = $this->api->getComments($post['id'], $after, self::BATCH_SIZE);
                $comments = $page['items'] ?? [];
            } catch (\Throwable) {
                break;
            }

            if (empty($comments)) break;

            // Filter out comments already analysed in this run
            $newComments = $this->filterAlreadyAnalysed($comments);

            if (!empty($newComments)) {
                $batchStats = $this->analyseAndStore($newComments, $post['id'], $run);
                $counts['scanned']  += count($newComments);
                $counts['flagged']  += $batchStats['flagged'];
                $counts['review']   += $batchStats['review'];
                $counts['safe']     += $batchStats['safe'];
            }

            $after = $page['meta']['nextCursor'] ?? null;

        } while ($after !== null);

        return $counts;
    }

    /**
     * Remove comments that already have a moderation record created today.
     * This prevents re-analysing the same comment on every run.
     */
    private function filterAlreadyAnalysed(array $comments): array
    {
        $ids = array_column($comments, 'id');

        $alreadyDone = ModerationRecord::query()
            ->whereIn('comment_id', $ids)
            ->where('created_at', '>=', now()->startOfDay())
            ->pluck('comment_id')
            ->flip()
            ->toArray();

        return array_filter($comments, fn($c) => !isset($alreadyDone[$c['id']]));
    }

    /**
     * Send a batch to the AI, store records, push flagged items to queue.
     */
    private function analyseAndStore(array $comments, string $postId, ScanRun $run): array
    {
        $stats = ['flagged' => 0, 'review' => 0, 'safe' => 0];

        // Prepare payload for the moderator
        $payload = array_map(fn($c) => [
            'id'       => $c['id'],
            'content'  => $c['content'],
            'authorId' => $c['authorId'] ?? '',
        ], $comments);

        $results = $this->moderator->moderateBatch($payload);

        // Build a map so we can look up comment details by ID
        $commentMap = collect($comments)->keyBy('id');

        foreach ($results as $result) {
            $comment = $commentMap->get($result['id']);
            if (!$comment) continue;

            // Store in moderation_records (append-only)
            $record = ModerationRecord::create([
                'comment_id'     => $result['id'],
                'post_id'        => $postId,
                'author_id'      => $comment['authorId'] ?? '',
                'content'        => $comment['content'],
                'verdict'        => $result['verdict'],
                'confidence_pct' => (int) round(($result['confidence'] ?? 0) * 100),
                'categories'     => $result['categories'] ?? [],
                'explanation'    => $result['explanation'] ?? '',
                'flagged_phrases'=> $result['flaggedPhrases'] ?? [],
                'model'          => config('services.moderator.model', 'claude-haiku-3-5-20251001'),
                'trigger'        => 'auto',
            ]);

            // Push to moderation_queue if verdict is 'review' or 'remove'
            if (in_array($result['verdict'], ['review', 'remove'], true)) {
                // Upsert — if the comment is already in the queue, update its verdict
                ModerationQueue::updateOrCreate(
                    ['comment_id' => $result['id']],
                    [
                        'post_id'              => $postId,
                        'author_id'            => $comment['authorId'] ?? '',
                        'content'              => $comment['content'],
                        'verdict'              => $result['verdict'],
                        'confidence_pct'       => (int) round(($result['confidence'] ?? 0) * 100),
                        'explanation'          => $result['explanation'] ?? '',
                        'flagged_phrases'      => $result['flaggedPhrases'] ?? [],
                        'status'               => 'pending',
                        'resolved_by'          => null,
                        'resolved_at'          => null,
                        'moderation_record_id' => $record->id,
                    ]
                );

                $result['verdict'] === 'remove' ? $stats['flagged']++ : $stats['review']++;
            } else {
                $stats['safe']++;
            }
        }

        return $stats;
    }
}
