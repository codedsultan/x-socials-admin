<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\ContentType;
use App\Enums\ModerationVerdict;
use App\Models\ModerationRecord;
use App\Services\ModerationAnalysisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModerationAnalysisServiceTest extends TestCase
{
    use RefreshDatabase;

    private ModerationAnalysisService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new ModerationAnalysisService;
    }

    public function test_hydrate_from_cache_returns_null_for_unscanned_comment(): void
    {
        $result = $this->service->hydrateFromCache(['comment-not-scanned']);

        $this->assertNull($result['comment-not-scanned']);
    }

    public function test_hydrate_from_cache_shapes_record_for_frontend(): void
    {
        $record = ModerationRecord::factory()->create([
            'content_id' => 'comment-123',
            'content_type' => ContentType::Comment,
            'verdict' => ModerationVerdict::Remove,
            'confidence_pct' => 92,
            'categories' => ['spam'],
            'explanation' => 'This is spam.',
            'flagged_phrases' => ['buy now'],
            'model' => 'claude-haiku-4',
        ]);

        $result = $this->service->hydrateFromCache(['comment-123']);

        $analysis = $result['comment-123'];
        $this->assertNotNull($analysis);
        $this->assertSame('comment-123', $analysis['id']);
        $this->assertSame('remove', $analysis['verdict']);
        $this->assertSame(0.92, $analysis['confidence']);
        $this->assertTrue($analysis['fromCache']);
        $this->assertFalse($analysis['error']);
        $this->assertSame(['spam'], $analysis['categories']);
    }

    public function test_hydrate_from_cache_returns_most_recent_record_for_duplicates(): void
    {
        // Two scans on different days for the same comment (unique constraint is per day)
        ModerationRecord::factory()->create([
            'content_id' => 'comment-456',
            'content_type' => ContentType::Comment,
            'verdict' => ModerationVerdict::Review,
            'confidence_pct' => 50,
            'created_at' => now()->subDay(),
            'created_date' => now()->subDay()->toDateString(),
        ]);

        ModerationRecord::factory()->create([
            'content_id' => 'comment-456',
            'content_type' => ContentType::Comment,
            'verdict' => ModerationVerdict::Remove,
            'confidence_pct' => 95,
            'created_at' => now(),
            'created_date' => now()->toDateString(),
        ]);

        $result = $this->service->hydrateFromCache(['comment-456']);

        $this->assertSame('remove', $result['comment-456']['verdict']);
        $this->assertSame(0.95, $result['comment-456']['confidence']);
    }

    public function test_hydrate_from_cache_returns_empty_array_for_empty_input(): void
    {
        $result = $this->service->hydrateFromCache([]);

        $this->assertSame([], $result);
    }
}
