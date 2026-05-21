<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ScanRunStatus;
use App\Models\ScanRun;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScanRun>
 */
class ScanRunFactory extends Factory
{
    protected $model = ScanRun::class;

    public function definition(): array
    {
        return [
            'status' => ScanRunStatus::Completed,
            'posts_scanned' => $this->faker->numberBetween(0, 100),
            'comments_scanned' => $this->faker->numberBetween(0, 500),
            'flagged' => $this->faker->numberBetween(0, 10),
            'queued_for_review' => $this->faker->numberBetween(0, 5),
            'safe' => $this->faker->numberBetween(0, 490),
            'error_message' => null,
            'started_at' => now()->subMinutes(5),
            'finished_at' => now(),
            // No created_at/updated_at — scan_runs uses started_at/finished_at instead
        ];
    }
}
