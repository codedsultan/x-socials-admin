<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ScanRunStatus;
use Database\Factories\ScanRunFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScanRun extends Model
{
    /** @use HasFactory<ScanRunFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'status',
        'posts_scanned',
        'comments_scanned',
        'flagged',
        'queued_for_review',
        'safe',
        'error_message',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'status' => ScanRunStatus::class,
    ];

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeFinished(Builder $query): Builder
    {
        return $query->whereIn('status', [ScanRunStatus::Completed, ScanRunStatus::Failed]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function durationSeconds(): ?int
    {
        if (! $this->finished_at) {
            return null;
        }

        return $this->started_at->diffInSeconds($this->finished_at);
    }

    public function markCompleted(array $counts): void
    {
        $this->update(array_merge($counts, [
            'status' => ScanRunStatus::Completed,
            'finished_at' => now(),
        ]));
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status' => ScanRunStatus::Failed,
            'error_message' => $error,
            'finished_at' => now(),
        ]);
    }
}
