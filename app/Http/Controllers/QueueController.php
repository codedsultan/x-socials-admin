<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\ModerationQueue;
use App\Models\AdminActionLog;
use App\Models\ScanRun;
use App\Services\XSocialsApiService;

class QueueController extends Controller
{
    public function __construct(private readonly XSocialsApiService $api) {}

    public function index(Request $request): Response
    {
        $verdict     = $request->query('verdict');
        $status      = $request->query('status', 'pending');
        $contentType = $request->query('content_type');  // 'post' | 'comment' | null (all)

        $query = ModerationQueue::query()
            ->when($verdict,     fn($q) => $q->where('verdict', $verdict))
            ->when($contentType, fn($q) => $q->where('content_type', $contentType))
            ->where('status', $status)
            ->orderByRaw("CASE verdict WHEN 'remove' THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'asc')
            ->paginate(25);

        $lastScan = ScanRun::query()
            ->whereIn('status', ['completed', 'failed'])
            ->latest('started_at')
            ->first();

        $pendingCounts = [
            'remove'          => ModerationQueue::where('status', 'pending')->where('verdict', 'remove')->count(),
            'review'          => ModerationQueue::where('status', 'pending')->where('verdict', 'review')->count(),
            'posts_pending'   => ModerationQueue::where('status', 'pending')->where('content_type', 'post')->count(),
            'comments_pending'=> ModerationQueue::where('status', 'pending')->where('content_type', 'comment')->count(),
        ];

        return Inertia::render('Queue/Index', [
            'items'         => $query->items(),
            'pagination'    => [
                'total'       => $query->total(),
                'currentPage' => $query->currentPage(),
                'lastPage'    => $query->lastPage(),
                'perPage'     => $query->perPage(),
            ],
            'filters'       => ['verdict' => $verdict, 'status' => $status, 'content_type' => $contentType],
            'pendingCounts' => $pendingCounts,
            'lastScan'      => $lastScan,
        ]);
    }

    /**
     * Admin keeps the content (marks as reviewed, no deletion).
     */
    public function keep(Request $request, int $id): RedirectResponse
    {
        $item  = ModerationQueue::findOrFail($id);
        $admin = $this->resolveAdmin();

        $item->resolve($admin->id, 'reviewed', $request->input('note'));

        AdminActionLog::record(
            actor:      $admin,
            action:     'dismiss_queue_item',
            targetType: $item->content_type,
            targetId:   $item->content_id,
            meta:       ['verdict' => $item->verdict, 'queue_id' => $item->id, 'content_type' => $item->content_type],
            ip:         $request->ip(),
        );

        $label = $item->isPost() ? 'Post' : 'Comment';
        return back()->with('success', "{$label} kept — marked as reviewed.");
    }

    /**
     * Admin removes the content — deletes from Node API then resolves queue item.
     * Branches on content_type: post deletes call deletePost(), comment deletes call deleteComment().
     */
    public function remove(Request $request, int $id): RedirectResponse
    {
        $item  = ModerationQueue::findOrFail($id);
        $admin = $this->resolveAdmin();

        // Delegate to the correct Node.js admin endpoint based on content type
        $deleted = $item->isPost()
            ? $this->api->deletePost($item->content_id)
            : $this->api->deleteComment($item->content_id);

        $label = $item->isPost() ? 'post' : 'comment';

        if (!$deleted) {
            return back()->with('error',
                "Could not delete {$label} from Node API. It may have already been deleted."
            );
        }

        $item->resolve($admin->id, 'removed', $request->input('note'));

        AdminActionLog::record(
            actor:      $admin,
            action:     'resolve_queue_item',
            targetType: $item->content_type,
            targetId:   $item->content_id,
            meta:       [
                'verdict'        => $item->verdict,
                'confidence_pct' => $item->confidence_pct,
                'queue_id'       => $item->id,
                'content_type'   => $item->content_type,
            ],
            ip: $request->ip(),
        );

        return back()->with('success', ucfirst($label) . ' removed from the platform.');
    }

    private function resolveAdmin(): \App\Models\AdminUser
    {
        /** @var \App\Models\AdminUser */
        return Auth::guard('admin')->user();
    }
}
