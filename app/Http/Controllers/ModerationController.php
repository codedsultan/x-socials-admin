<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use App\Services\XSocialsApiService;
use App\Services\ModeratorService;

class ModerationController extends Controller
{
    public function __construct(
        private readonly XSocialsApiService $api,
        private readonly ModeratorService   $moderator,
    ) {
    }

    /**
     * Moderation queue — lists comments from a post and runs AI analysis.
     */
    public function index(Request $request): Response
    {
        $postId = $request->query('postId', '');
        $after  = $request->query('after');

        $comments  = [];
        $meta      = [];
        $modResults = [];

        if ($postId) {
            $data     = $this->api->getComments($postId, $after, 20);
            $comments = $data['items'] ?? [];
            $meta     = $data['meta']  ?? [];

            // Batch-moderate all loaded comments in one round-trip
            if (!empty($comments)) {
                $batch      = array_map(fn ($c) => [
                    'id'       => $c['id'],
                    'content'  => $c['content'],
                    'authorId' => $c['authorId'] ?? '',
                ], $comments);

                $modResults = $this->moderator->moderateBatch($batch);
            }
        }

        // Key moderation results by comment ID for O(1) lookup in the template
        $modByCommentId = collect($modResults)->keyBy('id')->toArray();

        return Inertia::render('Moderation/Index', [
            'postId'   => $postId,
            'comments' => $comments,
            'meta'     => $meta,
            'analysis' => $modByCommentId,
        ]);
    }

    /**
     * Analyse a single comment on demand (called from the comment detail modal).
     */
    public function analyse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id'       => ['required', 'string'],
            'content'  => ['required', 'string'],
            'authorId' => ['nullable', 'string'],
        ]);

        $result = $this->moderator->moderate(
            $validated['id'],
            $validated['content'],
            $validated['authorId'] ?? ''
        );

        return response()->json($result);
    }

    /**
     * Admin deletes a comment after reviewing the AI verdict.
     */
    public function destroyComment(string $commentId): RedirectResponse
    {
        $deleted = $this->api->deleteComment($commentId);

        if ($deleted) {
            /** @var \App\Models\User $admin */
            $admin = \Illuminate\Support\Facades\Auth::guard('admin')->user();
            \App\Models\AdminActionLog::record(
                actor:      $admin,
                action:     'delete_comment',
                targetType: 'comment',
                targetId:   $commentId,
                meta:       ['source' => 'on_demand_moderation'],
                ip:         request()->ip(),
            );
        }

        return $deleted
            ? back()->with('success', 'Comment removed.')
            : back()->with('error', 'Could not remove comment.');
    }
}
