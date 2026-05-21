<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\ContentType;
use App\Enums\ModerationStatus;
use App\Enums\ModerationVerdict;
use App\Models\ModerationQueue;
use App\Models\User;
use App\Services\QueueService;
use App\Services\XSocialsApiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class QueueServiceTest extends TestCase
{
    use RefreshDatabase;

    private XSocialsApiService $api;

    private QueueService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->api = Mockery::mock(XSocialsApiService::class);
        $this->service = new QueueService($this->api);
    }

    public function test_pending_counts_returns_correct_breakdown(): void
    {
        ModerationQueue::factory()->create(['status' => ModerationStatus::Pending, 'verdict' => ModerationVerdict::Remove, 'content_type' => ContentType::Post]);
        ModerationQueue::factory()->create(['status' => ModerationStatus::Pending, 'verdict' => ModerationVerdict::Remove, 'content_type' => ContentType::Comment]);
        ModerationQueue::factory()->create(['status' => ModerationStatus::Pending, 'verdict' => ModerationVerdict::Review, 'content_type' => ContentType::Comment]);

        $counts = $this->service->pendingCounts();

        $this->assertSame(2, $counts['remove']);
        $this->assertSame(1, $counts['review']);
        $this->assertSame(1, $counts['posts_pending']);
        $this->assertSame(2, $counts['comments_pending']);
    }

    public function test_keep_marks_item_as_reviewed_and_logs_action(): void
    {
        $admin = User::factory()->create();
        $item = ModerationQueue::factory()->create([
            'status' => ModerationStatus::Pending,
            'content_type' => ContentType::Comment,
            'verdict' => ModerationVerdict::Review,
        ]);

        $this->service->keep($item, $admin, 'Looks fine', '127.0.0.1');

        $this->assertSame(ModerationStatus::Reviewed, $item->fresh()->status);
        $this->assertDatabaseHas('admin_action_logs', [
            'actor_id' => $admin->id,
            'action' => 'dismiss_queue_item',
            'target_id' => $item->content_id,
        ]);
    }

    public function test_remove_calls_api_resolves_item_and_logs_action(): void
    {
        $admin = User::factory()->create();
        $item = ModerationQueue::factory()->create([
            'status' => ModerationStatus::Pending,
            'content_type' => ContentType::Comment,
            'verdict' => ModerationVerdict::Remove,
            'content_id' => 'comment-abc',
        ]);

        $this->api->shouldReceive('deleteComment')->with('comment-abc')->andReturn(true);

        $result = $this->service->remove($item, $admin, null, '127.0.0.1');

        $this->assertTrue($result);
        $this->assertSame(ModerationStatus::Removed, $item->fresh()->status);
        $this->assertDatabaseHas('admin_action_logs', [
            'actor_id' => $admin->id,
            'action' => 'resolve_queue_item',
        ]);
    }

    public function test_remove_returns_false_when_api_fails(): void
    {
        $admin = User::factory()->create();
        $item = ModerationQueue::factory()->create([
            'status' => ModerationStatus::Pending,
            'content_type' => ContentType::Post,
            'verdict' => ModerationVerdict::Remove,
            'content_id' => 'post-xyz',
        ]);

        $this->api->shouldReceive('deletePost')->with('post-xyz')->andReturn(false);

        $result = $this->service->remove($item, $admin, null, '127.0.0.1');

        $this->assertFalse($result);
        $this->assertSame(ModerationStatus::Pending, $item->fresh()->status);
        $this->assertDatabaseMissing('admin_action_logs', ['actor_id' => $admin->id]);
    }
}
