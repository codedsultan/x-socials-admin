<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Models\ModerationQueue;
use App\Models\ModerationRecord;
use App\Models\AdminActionLog;
use App\Models\ScanRun;
use App\Services\XSocialsApiService;

class QueueController extends Controller
{
    public function __construct(private readonly XSocialsApiService $api)
    {
    }

    /**
     * Human review queue — pending items sorted by verdict severity then date.
     */
    public function index(Request $request): Response
    {
        $verdict = $request->query('verdict');   // 'review' | 'remove' | null (all)
        $status  = $request->query('status', 'pending');

        $query = ModerationQueue::query()
            ->when($verdict, fn ($q) => $q->where('verdict', $verdict))
            ->where('status', $status)
            ->orderByRaw("CASE verdict WHEN 'remove' THEN 0 ELSE 1 END")  // 'remove' first
            ->orderBy('created_at', 'asc')   // oldest unresolved first
            ->paginate(25);

        // Last scan run info for the dashboard widget
        $lastScan = ScanRun::query()
            ->whereIn('status', ['completed', 'failed'])
            ->latest('started_at')
            ->first();

        $pendingCounts = [
            'remove' => ModerationQueue::where('status', 'pending')->where('verdict', 'remove')->count(),
            'review' => ModerationQueue::where('status', 'pending')->where('verdict', 'review')->count(),
        ];

        return Inertia::render('Queue/Index', [
            'items'         => $query->items(),
            'pagination'    => [
                'total'       => $query->total(),
                'currentPage' => $query->currentPage(),
                'lastPage'    => $query->lastPage(),
                'perPage'     => $query->perPage(),
            ],
            'filters'       => ['verdict' => $verdict, 'status' => $status],
            'pendingCounts' => $pendingCounts,
            'lastScan'      => $lastScan,
        ]);
    }

    /**
     * Admin keeps the comment (marks as reviewed, no deletion).
     */
    public function keep(Request $request, int $id): RedirectResponse
    {
        $item  = ModerationQueue::findOrFail($id);
        $admin = $this->resolveAdmin($request);

        $item->resolve($admin->id, 'reviewed', $request->input('note'));

        AdminActionLog::record(
            actor:      $admin,
            action:     'dismiss_queue_item',
            targetType: 'comment',
            targetId:   $item->comment_id,
            meta:       ['verdict' => $item->verdict, 'queue_id' => $item->id],
            ip:         $request->ip(),
        );

        return back()->with('success', 'Comment kept — marked as reviewed.');
    }

    /**
     * Admin removes the comment — deletes from Node API then resolves queue item.
     */
    public function remove(Request $request, int $id): RedirectResponse
    {
        $item  = ModerationQueue::findOrFail($id);
        $admin = $this->resolveAdmin($request);

        $deleted = $this->api->deleteComment($item->comment_id);

        if (!$deleted) {
            return back()->with('error', 'Could not delete comment from Node API. It may have already been deleted.');
        }

        $item->resolve($admin->id, 'removed', $request->input('note'));

        AdminActionLog::record(
            actor:      $admin,
            action:     'resolve_queue_item',
            targetType: 'comment',
            targetId:   $item->comment_id,
            meta:       ['verdict' => $item->verdict, 'confidence_pct' => $item->confidence_pct, 'queue_id' => $item->id],
            ip:         $request->ip(),
        );

        return back()->with('success', 'Comment removed from the platform.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Resolve the authenticated admin from the Laravel session guard.
     * This is always populated because the route is behind admin.auth middleware.
     *
     * @return \App\Models\User
     */
    private function resolveAdmin(Request $request): \App\Models\User
    {
        /** @var \App\Models\User */
        return \Illuminate\Support\Facades\Auth::guard('admin')->user();
    }
}
