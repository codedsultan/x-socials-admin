<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContentType;
use App\Enums\ModerationTrigger;
use App\Enums\ModerationVerdict;
use Database\Factories\ModerationRecordFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ModerationRecord extends Model
{
    /** @use HasFactory<ModerationRecordFactory> */
    use HasFactory;

    protected $fillable = [
        'comment_id',
        'post_id',
        'content_type',
        'content_id',
        'author_id',
        'content',
        'verdict',
        'confidence_pct',
        'categories',
        'explanation',
        'flagged_phrases',
        'model',
        'trigger',
    ];

    protected $casts = [
        'categories' => 'array',
        'flagged_phrases' => 'array',
        'confidence_pct' => 'integer',
        'verdict' => ModerationVerdict::class,
        'content_type' => ContentType::class,
        'trigger' => ModerationTrigger::class,
    ];

    public function queueItem(): HasOne
    {
        return $this->hasOne(ModerationQueue::class, 'moderation_record_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForContentIds(Builder $query, array $ids): Builder
    {
        return $query->whereIn('content_id', $ids);
    }

    public function scopeComments(Builder $query): Builder
    {
        return $query->where('content_type', ContentType::Comment->value);
    }

    public function scopeRecentDays(Builder $query, int $days): Builder
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function confidenceFloat(): float
    {
        return $this->confidence_pct / 100;
    }

    public function isPost(): bool
    {
        return $this->content_type === ContentType::Post;
    }

    public function isComment(): bool
    {
        return $this->content_type === ContentType::Comment;
    }
}
