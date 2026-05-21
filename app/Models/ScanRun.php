<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScanRun extends Model
{
    public const UPDATED_AT = null;

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
    ];

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
            'status' => 'completed',
            'finished_at' => now(),
        ]));
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
            'finished_at' => now(),
        ]);
    }
}
