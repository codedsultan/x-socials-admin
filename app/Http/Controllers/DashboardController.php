<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\DashboardService;
use App\Services\ModeratorService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboard,
        private readonly ModeratorService $moderator,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Dashboard/Index', [
            ...$this->dashboard->platformStats(),
            'queueStats' => $this->dashboard->queueStats(),
            'lastScan' => $this->dashboard->lastScan(),
            'triggerBreakdown' => $this->dashboard->triggerBreakdown(),
            'autoThreshold' => (float) config('services.moderation.auto_enforce_threshold', 0.95),
            ...$this->moderator->health(),
        ]);
    }
}
