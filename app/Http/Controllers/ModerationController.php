<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\ModerationRecord;
use App\Models\AdminActionLog;
use App\Services\XSocialsApiService;
use App\Services\ModeratorService;

/**
 * ModerationController  (optimised)
 *
 * Changes from original:
 *   [Fix 5] index() no longer calls moderateBatch() on every page load.
 *
 *   The original fetched the page's comments from the Node.js API, then
 *   immediately sent them ALL to the FastAPI AI service for fresh analysis —
 *   every single time an admin opened or refreshed the moderation page.
 *
 *   With 20 comments per page and several active admins, this created a
 *   continuous stream of paid AI calls for content that was already analysed
 *   by the background scan and has results sitting in moderation_records.
 *
 *   New behaviour:
 *     1. Fetch comments from the Node.js API (unchanged).
 *     2. Query moderation_records for existing analysis of those comment IDs.
 *     3. Return stored results to the frontend — no AI call made.
 *     4. Comments with no stored record are returned with analysis=null.
 *        The frontend can show a "Not yet analysed" state and let the admin
 *        trigger a fresh analysis via the existing analyse() endpoint.
 *
 *   The analyse() endpoint (on-demand single comment) is unchanged — admins
 *   can still click "Re-analyse" to get a fresh verdict, and can pass a
 *   force_model to escalate to a higher-quality model (e.g. Sonnet).
 *
 *   Cost impact:
 *     Before: 20 AI calls × every page load × N admins
 *     After:  0 AI calls on page load; 1 call only when admin clicks Re-analyse
 */
class ModerationController extends Controller
{
    public function __construct(
        private readonly XSocialsApiService $api,
        private readonly ModeratorService   $moderator,
    ) {
    }

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
        $after  = $request->query('after');

        $comments   = [];
        $meta       = [];
        $modByCommentId = [];

        if ($postId) {
            $data     = $this->api->getComments($postId, $after, 20);
            $comments = $data['items'] ?? [];
            $meta     = $data['meta']  ?? [];

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
                        'id'             => $cid,
                        'verdict'        => $record->verdict,
                        'confidence'     => $record->confidenceFloat(),
                        'categories'     => $record->categories ?? [],
                        'explanation'    => $record->explanation,
                        'flaggedPhrases' => $record->flagged_phrases ?? [],
                        'model'          => $record->model,
                        'analysedAt'     => $record->created_at?->toISOString(),
                        'error'          => false,
                        'fromCache'      => true,   // tells the frontend this is stored, not live
                    ] : null;  // null = not yet scanned; frontend shows "Pending scan"
                }
            }
        }

        return Inertia::render('Moderation/Index', [
            'postId'   => $postId,
            'comments' => $comments,
            'meta'     => $meta,
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
            'id'         => ['required', 'string'],
            'content'    => ['required', 'string'],
            'authorId'   => ['nullable', 'string'],
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
            /** @var \App\Models\AdminUser $admin */
            $admin = Auth::guard('admin')->user();
            AdminActionLog::record(
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
