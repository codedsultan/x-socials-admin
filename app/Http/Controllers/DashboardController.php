<?php

namespace App\Http\Controllers;

use App\Models\ModerationQueue;
use App\Models\ScanRun;
use App\Services\XSocialsApiService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DashboardController  (updated)
 *
 * Changes:
 *   The health check now extracts 'realtime_stats' from FastAPI's /health
 *   response and passes it to the Inertia page as 'moderatorStats'.
 *
 *   Also passes 'triggerBreakdown' — a DB query that splits moderation_records
 *   by trigger ('realtime' vs 'auto' vs 'manual') for the last 7 days.
 *   This is the permanent audit trail that complements the in-memory stats.
 *
 *   queueStats gains 'autoRemovedToday' for the dashboard auto-remove card.
 */
class DashboardController extends Controller
{
    public function __construct(private readonly XSocialsApiService $api) {}

    public function index(): Response
    {
        // ── Platform stats from Node.js API ───────────────────────────────────
        $stats = [];
        $apiOk = true;

        try {
            $users = $this->api->getUsers(1, 1);
            $posts = $this->api->getPosts(1, 1);
            $stats = [
                'totalUsers' => $users['meta']['total'] ?? 0,
                'totalPosts' => $posts['meta']['total'] ?? 0,
            ];
        } catch (\Throwable) {
            $stats = ['totalUsers' => '—', 'totalPosts' => '—'];
            $apiOk = false;
        }

        // ── FastAPI health + realtime queue stats ─────────────────────────────
        $moderatorOk = false;
        $moderatorStats = [];

        try {
            $health = Http::timeout(5)
                ->get(config('services.moderator.url', 'http://localhost:8001').'/health');

            if ($health->successful()) {
                $moderatorOk = true;
                $moderatorStats = $health->json('realtime_stats', []);
            }
        } catch (\Throwable) {
        }

        // ── Moderation queue counts (single GROUP BY query) ───────────────────
        $rawCounts = DB::table('moderation_queue')
            ->select('verdict', DB::raw('COUNT(*) as cnt'))
            ->where('status', 'pending')
            ->groupBy('verdict')
            ->pluck('cnt', 'verdict');

        $queueStats = [
            'pendingRemove' => (int) ($rawCounts['remove'] ?? 0),
            'pendingReview' => (int) ($rawCounts['review'] ?? 0),
            'resolvedToday' => ModerationQueue::whereIn('status', ['reviewed', 'removed'])
                ->whereDate('resolved_at', today())
                ->count(),
            'autoRemovedToday' => ModerationQueue::where('status', 'auto_removed')
                ->whereDate('resolved_at', today())
                ->count(),
        ];

        // ── Trigger breakdown — 7-day split of realtime vs auto vs manual ─────
        // Permanent audit trail that complements the in-memory moderatorStats.
        // Shows webhook health over time even after a FastAPI restart.
        $triggerBreakdown = DB::table('moderation_records')
            ->select('trigger', DB::raw('COUNT(*) as total'))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('trigger')
            ->pluck('total', 'trigger')
            ->toArray();

        // ── Last scan run ─────────────────────────────────────────────────────
        $lastScan = ScanRun::query()
            ->whereIn('status', ['completed', 'failed'])
            ->latest('started_at')
            ->first();

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'queueStats' => $queueStats,
            'lastScan' => $lastScan,
            'apiOk' => $apiOk,
            'moderatorOk' => $moderatorOk,
            'moderatorStats' => $moderatorStats,    // in-memory realtime queue stats
            'triggerBreakdown' => $triggerBreakdown,  // permanent DB audit split
            'autoThreshold' => (float) config('services.moderation.auto_enforce_threshold', 0.95),
        ]);
    }
}
