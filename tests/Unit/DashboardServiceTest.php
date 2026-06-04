<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\ModerationStatus;
use App\Enums\ModerationTrigger;
use App\Enums\ModerationVerdict;
use App\Enums\ScanRunStatus;
use App\Models\ModerationQueue;
use App\Models\ModerationRecord;
use App\Models\ScanRun;
use App\Services\DashboardService;
use App\Services\XSocialsApiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class DashboardServiceTest extends TestCase
{
    use RefreshDatabase;

    private XSocialsApiService $api;

    private DashboardService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->api = Mockery::mock(XSocialsApiService::class);
        $this->service = new DashboardService($this->api);
    }

    public function test_platform_stats_returns_counts_from_api(): void
    {
        $this->api->shouldReceive('getUsers')->with(1, 1)->andReturn(['meta' => ['total' => 42]]);
        $this->api->shouldReceive('getPosts')->with(1, 1)->andReturn(['meta' => ['total' => 7]]);

        $result = $this->service->platformStats();

        $this->assertTrue($result['apiOk']);
        $this->assertSame(42, $result['stats']['totalUsers']);
        $this->assertSame(7, $result['stats']['totalPosts']);
    }

    public function test_platform_stats_returns_dashes_when_api_fails(): void
    {
        $this->api->shouldReceive('getUsers')->andThrow(new \RuntimeException('API down'));

        $result = $this->service->platformStats();

        $this->assertFalse($result['apiOk']);
        $this->assertSame('—', $result['stats']['totalUsers']);
        $this->assertSame('—', $result['stats']['totalPosts']);
    }

    public function test_queue_stats_counts_pending_items_by_verdict(): void
    {
        ModerationQueue::factory()->create(['status' => ModerationStatus::Pending, 'verdict' => ModerationVerdict::Remove]);
        ModerationQueue::factory()->create(['status' => ModerationStatus::Pending, 'verdict' => ModerationVerdict::Remove]);
        ModerationQueue::factory()->create(['status' => ModerationStatus::Pending, 'verdict' => ModerationVerdict::Review]);

        $stats = $this->service->queueStats();

        $this->assertSame(2, $stats['pendingRemove']);
        $this->assertSame(1, $stats['pendingReview']);
    }

    public function test_queue_stats_counts_resolved_and_auto_removed_today(): void
    {
        ModerationQueue::factory()->create([
            'status' => ModerationStatus::Reviewed,
            'resolved_at' => now(),
        ]);
        ModerationQueue::factory()->create([
            'status' => ModerationStatus::AutoRemoved,
            'resolved_at' => now(),
        ]);

        $stats = $this->service->queueStats();

        $this->assertSame(1, $stats['resolvedToday']);
        $this->assertSame(1, $stats['autoRemovedToday']);
    }

    public function test_trigger_breakdown_groups_records_by_trigger(): void
    {
        ModerationRecord::factory()->create(['trigger' => ModerationTrigger::Realtime, 'created_at' => now()]);
        ModerationRecord::factory()->create(['trigger' => ModerationTrigger::Realtime, 'created_at' => now()]);
        ModerationRecord::factory()->create(['trigger' => ModerationTrigger::Manual, 'created_at' => now()]);
        // older than 7 days — should be excluded
        ModerationRecord::factory()->create([
            'trigger' => ModerationTrigger::Auto,
            'created_at' => now()->subDays(8),
            'created_date' => now()->subDays(8)->toDateString(),
        ]);

        $breakdown = $this->service->triggerBreakdown();

        $this->assertSame(2, $breakdown['realtime']);
        $this->assertSame(1, $breakdown['manual']);
        $this->assertArrayNotHasKey('auto', $breakdown);
    }

    public function test_last_scan_returns_most_recent_finished_reconciliation_scan(): void
    {
        ScanRun::factory()->create(['status' => ScanRunStatus::Completed, 'mode' => 'reconciliation', 'started_at' => now()->subHour()]);
        $latest = ScanRun::factory()->create(['status' => ScanRunStatus::Completed, 'mode' => 'reconciliation', 'started_at' => now()]);
        // Non-reconciliation scan should be excluded
        ScanRun::factory()->create(['status' => ScanRunStatus::Completed, 'mode' => 'manual', 'started_at' => now()->addMinute()]);

        $scan = $this->service->lastScan();

        $this->assertNotNull($scan);
        $this->assertSame($latest->id, $scan->id);
    }
}
