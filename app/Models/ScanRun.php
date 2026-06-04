<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ScanRunMode;
use App\Enums\ScanRunStatus;
use Database\Factories\ScanRunFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * ScanRun
 *
 * One row per background moderation scan execution.
 * Written by FastAPI, read by Laravel.
 *
 * Columns added since initial migration:
 *   mode — 'reconciliation' | 'standard' | 'manual'
 *          Written by FastAPI's scan_service.py via create_scan_run().
 *          See: 2026_06_03_000001_add_mode_to_scan_runs.php
 */
class ScanRun extends Model
{
    /** @use HasFactory<ScanRunFactory> */
    use HasFactory;

    public const CREATED_AT = null;

    public const UPDATED_AT = null;

    protected $fillable = [
        'status',
        'mode',
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

    // ── Computed helpers ──────────────────────────────────────────────────────

    /**
     * Duration in whole seconds, or null if the scan is still running.
     */
    public function durationSeconds(): ?int
    {
        if (! $this->finished_at) {
            return null;
        }

        return (int) $this->started_at->diffInSeconds($this->finished_at);
    }

    /**
     * Human-readable duration string, e.g. "1m 42s" or "38s".
     */
    public function durationForHumans(): ?string
    {
        $secs = $this->durationSeconds();
        if ($secs === null) {
            return null;
        }

        if ($secs < 60) {
            return "{$secs}s";
        }

        $m = intdiv($secs, 60);
        $s = $secs % 60;

        return $s > 0 ? "{$m}m {$s}s" : "{$m}m";
    }

    /**
     * Total items analysed (posts + comments).
     */
    public function totalScanned(): int
    {
        return ($this->posts_scanned ?? 0) + ($this->comments_scanned ?? 0);
    }

    /**
     * Total items flagged (remove + review).
     */
    public function totalFlagged(): int
    {
        return ($this->flagged ?? 0) + ($this->queued_for_review ?? 0);
    }

    /**
     * Tailwind colour token for the status badge.
     * Used by the Inertia page to style status pills without frontend logic.
     */
    public function statusColour(): string
    {
        return match ($this->status) {
            ScanRunStatus::Completed->value => 'success',
            ScanRunStatus::Failed->value => 'danger',
            ScanRunStatus::Running->value => 'accent',
            default => 'white',
        };
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeReconciliation(Builder $query): Builder
    {
        return $query->where('mode', ScanRunMode::Reconciliation->value);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', ScanRunStatus::Completed->value);
    }

    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('started_at', '>=', now()->subDays($days));
    }

    public function scopeFinished(Builder $query): Builder
    {
        return $query->whereIn('status', [ScanRunStatus::Completed->value, ScanRunStatus::Failed->value]);
    }

    // ── Mutations (called by ScanController for manual triggers) ──────────────

    public function markCompleted(array $counts): void
    {
        $this->update(array_merge($counts, [
            'status' => ScanRunStatus::Completed->value,
            'finished_at' => now(),
        ]));
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status' => ScanRunStatus::Failed->value,
            'error_message' => $error,
            'finished_at' => now(),
        ]);
    }
}
