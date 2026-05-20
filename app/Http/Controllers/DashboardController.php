<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Services\XSocialsApiService;

class DashboardController extends Controller
{
    public function __construct(private readonly XSocialsApiService $api) {}

    public function index(): Response
    {
        $stats   = [];
        $apiOk   = true;

        try {
            $users   = $this->api->getUsers(1, 1);
            $posts   = $this->api->getPosts(1, 1);
            $stats   = [
                'totalUsers'  => $users['meta']['total'] ?? 0,
                'totalPosts'  => $posts['meta']['total'] ?? 0,
            ];
        } catch (\Throwable) {
            $stats = ['totalUsers' => '—', 'totalPosts' => '—'];
            $apiOk = false;
        }

        // Queue stats come from Laravel's own DB — always available
        $queueStats = [
            'pendingRemove' => \App\Models\ModerationQueue::where('status', 'pending')->where('verdict', 'remove')->count(),
            'pendingReview' => \App\Models\ModerationQueue::where('status', 'pending')->where('verdict', 'review')->count(),
            'resolvedToday' => \App\Models\ModerationQueue::whereDate('resolved_at', today())->count(),
        ];

        $lastScan = \App\Models\ScanRun::query()
            ->whereIn('status', ['completed', 'failed'])
            ->latest('started_at')
            ->first();

        return Inertia::render('Dashboard/Index', [
            'stats'      => $stats,
            'queueStats' => $queueStats,
            'lastScan'   => $lastScan,
            'apiOk'      => $apiOk,
        ]);
    }
}
