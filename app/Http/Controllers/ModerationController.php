<?php

namespace App\Http\Controllers;

use App\Models\AdminActionLog;
use App\Models\ModerationRecord;
use App\Models\User;
use App\Services\ModeratorService;
use App\Services\XSocialsApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ModerationController extends Controller
{
    public function __construct(
        private readonly XSocialsApiService $api,
        private readonly ModeratorService $moderator,
    ) {}

    /**
     * Moderation review page — loads comments and their stored AI analysis.
     *
     * [Fix 5] Analysis is served from moderation_records (the scan results
     * database), not from a live AI call. This makes the page load cheap
     * regardless of how many admins are using the panel simultaneously.
     */
    public function index(Request $request): Response
    {
        $postId = $request->query('postId', '');
        $after = $request->query('after');

        $comments = [];
        $meta = [];
        $modByCommentId = [];

        if ($postId) {
            $data = $this->api->getComments($postId, $after, 20);
            $comments = $data['items'] ?? [];
            $meta = $data['meta'] ?? [];

            if (! empty($comments)) {
                $commentIds = array_column($comments, 'id');

                // [Fix 5] Fetch stored analysis from moderation_records.
                // Use the most recent record per content_id (a comment may
                // have been re-scanned — latest record wins).
                $records = ModerationRecord::query()
                    ->whereIn('content_id', $commentIds)
                    ->where('content_type', 'comment')
                    ->orderBy('created_at', 'desc')   // newest record first
                    ->get()
                    ->unique('content_id')             // keep only latest per id
                    ->keyBy('content_id');

                // Shape the stored records to match the AI service response
                // format so the frontend component needs no changes.
                foreach ($commentIds as $cid) {
                    $record = $records->get($cid);

                    $modByCommentId[$cid] = $record ? [
                        'id' => $cid,
                        'verdict' => $record->verdict,
                        'confidence' => $record->confidenceFloat(),
                        'categories' => $record->categories ?? [],
                        'explanation' => $record->explanation,
                        'flaggedPhrases' => $record->flagged_phrases ?? [],
                        'model' => $record->model,
                        'analysedAt' => $record->created_at?->toISOString(),
                        'error' => false,
                        'fromCache' => true,   // tells the frontend this is stored, not live
                    ] : null;  // null = not yet scanned; frontend shows "Pending scan"
                }
            }
        }

        return Inertia::render('Moderation/Index', [
            'postId' => $postId,
            'comments' => $comments,
            'meta' => $meta,
            'analysis' => $modByCommentId,
        ]);
    }

    /**
     * Analyse a single comment on demand.
     *
     * Called when an admin clicks "Re-analyse" or when a comment has no
     * stored record (analysis=null from index()). Optionally accepts a
     * force_model to upgrade to a higher-quality model for borderline cases.
     *
     * Results are returned to the caller only — no DB write here.
     * The background scan is responsible for writing moderation_records.
     */
    public function analyse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'string'],
            'content' => ['required', 'string'],
            'authorId' => ['nullable', 'string'],
            'force_model' => ['nullable', 'string'],
        ]);

        $result = $this->moderator->moderate(
            $validated['id'],
            $validated['content'],
            $validated['authorId'] ?? '',
            $validated['force_model'] ?? null,
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
            /** @var User $admin */
            $admin = Auth::user();
            AdminActionLog::record(
                actor: $admin,
                action: 'delete_comment',
                targetType: 'comment',
                targetId: $commentId,
                meta: ['source' => 'on_demand_moderation'],
                ip: request()->ip(),
            );
        }

        return $deleted
            ? back()->with('success', 'Comment removed.')
            : back()->with('error', 'Could not remove comment.');
    }
}
