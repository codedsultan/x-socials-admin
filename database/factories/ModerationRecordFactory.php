<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ContentType;
use App\Enums\ModerationTrigger;
use App\Enums\ModerationVerdict;
use App\Models\ModerationRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ModerationRecord>
 */
class ModerationRecordFactory extends Factory
{
    protected $model = ModerationRecord::class;

    public function definition(): array
    {
        $contentType = $this->faker->randomElement(ContentType::cases());
        $contentId = $this->faker->uuid();

        return [
            'comment_id' => $contentType === ContentType::Comment ? $contentId : null,
            'post_id' => $this->faker->uuid(),
            'author_id' => $this->faker->uuid(),
            'content' => $this->faker->sentence(),
            'content_type' => $contentType,
            'content_id' => $contentId,
            'verdict' => $this->faker->randomElement(ModerationVerdict::cases()),
            'confidence_pct' => $this->faker->numberBetween(10, 100),
            'categories' => [],
            'explanation' => $this->faker->sentence(),
            'flagged_phrases' => [],
            'model' => 'claude-haiku-4-5',
            'trigger' => $this->faker->randomElement(ModerationTrigger::cases()),
            'created_date' => now()->toDateString(),
        ];
    }
}
