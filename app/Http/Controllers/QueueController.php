<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\ModerationQueue;
use App\Models\AdminActionLog;
use App\Models\ScanRun;
use App\Services\XSocialsApiService;

/**
 * QueueController  (optimised)
 *
 * Changes from original:
 *   [Fix 7] pendingCounts is now a single GROUP BY query instead of four
 *           separate COUNT queries. The original fired four round-trips:
 *
 *               ModerationQueue::where('status','pending')->where('verdict','remove')->count()
 *               ModerationQueue::where('status','pending')->where('verdict','review')->count()
 *               ModerationQueue::where('status','pending')->where('content_type','post')->count()
 *               ModerationQueue::where('status','pending')->where('content_type','comment')->count()
 *
 *           Replaced with:
 *               SELECT verdict, content_type, COUNT(*) as cnt
 *               FROM moderation_queue WHERE status = 'pending'
 *               GROUP BY verdict, content_type
 *
 *           One query, same data, no semantic change in the UI.
 */
class QueueController extends Controller
{
    public function __construct(private readonly XSocialsApiService $api)
    {
    }

    public function index(Request $request): Response
    {
        $verdict     = $request->query('verdict');
        $status      = $request->query('status', 'pending');
        $contentType = $request->query('content_type');

        $query = ModerationQueue::query()
            ->when($verdict, fn ($q) => $q->where('verdict', $verdict))
            ->when($contentType, fn ($q) => $q->where('content_type', $contentType))
            ->where('status', $status)
            ->orderByRaw("CASE verdict WHEN 'remove' THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'asc')
            ->paginate(25);

        $lastScan = ScanRun::query()
            ->whereIn('status', ['completed', 'failed'])
            ->latest('started_at')
            ->first();

        // [Fix 7] Single GROUP BY query replaces four COUNT queries.
        // Result shape: [['verdict' => 'remove', 'content_type' => 'post', 'cnt' => 3], ...]
        $rawCounts = DB::table('moderation_queue')
            ->select('verdict', 'content_type', DB::raw('COUNT(*) as cnt'))
            ->where('status', 'pending')
            ->groupBy('verdict', 'content_type')
            ->get();

        // Pivot the flat rows into the shape the frontend expects.
        $pendingCounts = [
            'remove'           => 0,
            'review'           => 0,
            'posts_pending'    => 0,
            'comments_pending' => 0,
        ];

        foreach ($rawCounts as $row) {
            if ($row->verdict === 'remove') {
                $pendingCounts['remove'] += $row->cnt;
            } elseif ($row->verdict === 'review') {
                $pendingCounts['review'] += $row->cnt;
            }

            if ($row->content_type === 'post') {
                $pendingCounts['posts_pending'] += $row->cnt;
            } elseif ($row->content_type === 'comment') {
                $pendingCounts['comments_pending'] += $row->cnt;
            }
        }

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
     * Admin removes content — deletes from Node API then resolves the queue item.
     * Branches on content_type: posts call deletePost(), comments call deleteComment().
     */
    public function remove(Request $request, int $id): RedirectResponse
    {
        $item  = ModerationQueue::findOrFail($id);
        $admin = $this->resolveAdmin();

        $deleted = $item->isPost()
            ? $this->api->deletePost($item->content_id)
            : $this->api->deleteComment($item->content_id);

        $label = $item->isPost() ? 'post' : 'comment';

        if (! $deleted) {
            return back()->with(
                'error',
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
