<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\AdminAction;
use App\Http\Requests\ModerationAnalyseRequest;
use App\Models\AdminActionLog;
use App\Models\User;
use App\Services\ModerationAnalysisService;
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
        private readonly ModerationAnalysisService $analysis,
    ) {}

    public function index(Request $request): Response
    {
        $postId = (string) $request->query('postId', '');
        $after = $request->query('after');

        $comments = [];
        $meta = [];
        $analysisMap = [];

        if ($postId !== '') {
            $data = $this->api->getComments($postId, $after, 20);
            $comments = $data['items'] ?? [];
            $meta = $data['meta'] ?? [];
            $analysisMap = $this->analysis->hydrateFromCache(array_column($comments, 'id'));
        }

        return Inertia::render('Moderation/Index', [
            'postId' => $postId,
            'comments' => $comments,
            'meta' => $meta,
            'analysis' => $analysisMap,
        ]);
    }

    public function analyse(ModerationAnalyseRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->moderator->moderate(
            $validated['id'],
            $validated['content'],
            $validated['authorId'] ?? '',
            $validated['force_model'] ?? null,
        );

        return response()->json($result);
    }

    public function destroyComment(string $commentId): RedirectResponse
    {
        $deleted = $this->api->deleteComment($commentId);

        if ($deleted) {
            /** @var User $admin */
            $admin = Auth::user();
            AdminActionLog::record(
                actor: $admin,
                action: AdminAction::DeleteComment,
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
