<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContentType;
use App\Enums\ModerationStatus;
use App\Enums\ModerationVerdict;
use Database\Factories\ModerationQueueFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModerationQueue extends Model
{
    /** @use HasFactory<ModerationQueueFactory> */
    use HasFactory;

    protected $table = 'moderation_queue';

    protected $fillable = [
        'comment_id',
        'post_id',
        'content_type',
        'content_id',
        'author_id',
        'content',
        'verdict',
        'confidence_pct',
        'explanation',
        'flagged_phrases',
        'status',
        'resolved_by',
        'resolved_at',
        'resolution_note',
        'moderation_record_id',
    ];

    protected $casts = [
        'flagged_phrases' => 'array',
        'confidence_pct' => 'integer',
        'resolved_at' => 'datetime',
        'verdict' => ModerationVerdict::class,
        'status' => ModerationStatus::class,
        'content_type' => ContentType::class,
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(ModerationRecord::class, 'moderation_record_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', ModerationStatus::Pending->value);
    }

    public function scopeByStatus(Builder $query, ModerationStatus $status): Builder
    {
        return $query->where('status', $status->value);
    }

    public function scopeByVerdict(Builder $query, ModerationVerdict $verdict): Builder
    {
        return $query->where('verdict', $verdict->value);
    }

    public function scopeByContentType(Builder $query, ContentType $type): Builder
    {
        return $query->where('content_type', $type->value);
    }

    public function scopeResolved(Builder $query): Builder
    {
        return $query->whereIn('status', [ModerationStatus::Reviewed->value, ModerationStatus::Removed->value]);
    }

    public function scopeAutoRemoved(Builder $query): Builder
    {
        return $query->where('status', ModerationStatus::AutoRemoved->value);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === ModerationStatus::Pending;
    }

    public function isPost(): bool
    {
        return $this->content_type === ContentType::Post;
    }

    public function isComment(): bool
    {
        return $this->content_type === ContentType::Comment;
    }

    public function resolve(int $adminId, ModerationStatus $status, ?string $note = null): void
    {
        $this->update([
            'status' => $status->value,
            'resolved_by' => $adminId,
            'resolved_at' => now(),
            'resolution_note' => $note,
        ]);
    }

    public function autoRemove(string $note): void
    {
        $this->update([
            'status' => ModerationStatus::AutoRemoved->value,
            'resolved_by' => null,
            'resolved_at' => now(),
            'resolution_note' => $note,
        ]);
    }
}
