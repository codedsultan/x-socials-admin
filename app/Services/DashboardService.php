<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ModerationQueue;
use App\Models\ModerationRecord;
use App\Models\ScanRun;

class DashboardService
{
    public function __construct(
        private readonly XSocialsApiService $api,
    ) {}

    /**
     * @return array{stats: array{totalUsers: int|string, totalPosts: int|string}, apiOk: bool}
     */
    public function platformStats(): array
    {
        try {
            $users = $this->api->getUsers(1, 1);
            $posts = $this->api->getPosts(1, 1);

            return [
                'stats' => [
                    'totalUsers' => $users['meta']['total'] ?? 0,
                    'totalPosts' => $posts['meta']['total'] ?? 0,
                ],
                'apiOk' => true,
            ];
        } catch (\Throwable) {
            return [
                'stats' => ['totalUsers' => '—', 'totalPosts' => '—'],
                'apiOk' => false,
            ];
        }
    }

    /**
     * @return array{pendingRemove: int, pendingReview: int, resolvedToday: int, autoRemovedToday: int}
     */
    public function queueStats(): array
    {
        $verdictCounts = ModerationQueue::query()
            ->pending()
            ->selectRaw('verdict, COUNT(*) as cnt')
            ->groupBy('verdict')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->verdict->value => (int) $row->cnt]);

        return [
            'pendingRemove' => $verdictCounts->get('remove', 0),
            'pendingReview' => $verdictCounts->get('review', 0),
            'resolvedToday' => ModerationQueue::resolved()->whereDate('resolved_at', today())->count(),
            'autoRemovedToday' => ModerationQueue::autoRemoved()->whereDate('resolved_at', today())->count(),
        ];
    }

    /**
     * @return array<string, int>
     */
    public function triggerBreakdown(): array
    {
        return ModerationRecord::query()
            ->recentDays(7)
            ->selectRaw('trigger, COUNT(*) as total')
            ->groupBy('trigger')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->trigger->value => (int) $row->total])
            ->toArray();
    }

    public function lastScan(): ?ScanRun
    {
        return ScanRun::finished()->latest('started_at')->first();
    }
}
