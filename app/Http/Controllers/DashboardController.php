<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Http;
use App\Services\XSocialsApiService;
use App\Models\ModerationQueue;
use App\Models\ScanRun;

class DashboardController extends Controller
{
    public function __construct(private readonly XSocialsApiService $api) {}

    public function index(): Response
    {
        $stats = [];
        $apiOk = true;

        try {
            $users   = $this->api->getUsers(1, 1);
            $posts   = $this->api->getPosts(1, 1);
            $stats   = [
                'totalUsers' => $users['meta']['total'] ?? 0,
                'totalPosts' => $posts['meta']['total'] ?? 0,
            ];
        } catch (\Throwable) {
            $stats = ['totalUsers' => '—', 'totalPosts' => '—'];
            $apiOk = false;
        }

        // Check moderator health
        $moderatorOk = false;
        try {
            $health      = Http::timeout(5)->get(config('services.moderator.url', 'http://localhost:8001') . '/health');
            $moderatorOk = $health->successful();
        } catch (\Throwable) {}

        // Queue stats from Laravel's own DB — always available
        $queueStats = [
            'pendingRemove'    => ModerationQueue::where('status', 'pending')->where('verdict', 'remove')->count(),
            'pendingReview'    => ModerationQueue::where('status', 'pending')->where('verdict', 'review')->count(),
            'resolvedToday'    => ModerationQueue::whereIn('status', ['reviewed', 'removed'])->whereDate('resolved_at', today())->count(),
            'autoRemovedToday' => ModerationQueue::where('status', 'auto_removed')->whereDate('resolved_at', today())->count(),
        ];

        $lastScan = ScanRun::query()
            ->whereIn('status', ['completed', 'failed'])
            ->latest('started_at')
            ->first();

        return Inertia::render('Dashboard/Index', [
            'stats'         => $stats,
            'queueStats'    => $queueStats,
            'lastScan'      => $lastScan,
            'apiOk'         => $apiOk,
            'moderatorOk'   => $moderatorOk,
            'autoThreshold' => (float) config('services.moderation.auto_enforce_threshold', 0.95),
        ]);
    }
}
