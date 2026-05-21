<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ContentType;
use App\Enums\ModerationStatus;
use App\Enums\ModerationVerdict;
use App\Models\ModerationQueue;
use App\Models\ModerationRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ModerationQueue>
 */
class ModerationQueueFactory extends Factory
{
    protected $model = ModerationQueue::class;

    public function definition(): array
    {
        $contentType = $this->faker->randomElement(ContentType::cases());
        $contentId = $this->faker->uuid();

        $record = ModerationRecord::factory()->create([
            'content_type' => $contentType,
            'content_id' => $contentId,
        ]);

        return [
            'comment_id' => $contentType === ContentType::Comment ? $contentId : null,
            'post_id' => $this->faker->uuid(),
            'author_id' => $this->faker->uuid(),
            'content' => $this->faker->sentence(),
            'content_type' => $contentType,
            'content_id' => $contentId,
            'verdict' => $this->faker->randomElement(ModerationVerdict::cases()),
            'confidence_pct' => $this->faker->numberBetween(10, 100),
            'explanation' => $this->faker->sentence(),
            'flagged_phrases' => [],
            'status' => ModerationStatus::Pending,
            'resolved_by' => null,
            'resolved_at' => null,
            'resolution_note' => null,
            'moderation_record_id' => $record->id,
        ];
    }
}
