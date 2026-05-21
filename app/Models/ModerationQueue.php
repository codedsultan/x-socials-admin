<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModerationQueue extends Model
{
    protected $table = 'moderation_queue';

    protected $fillable = [
        'comment_id',        // null when content_type='post'
        'post_id',
        'content_type',      // 'comment' | 'post'
        'content_id',        // the ID of the comment or post in this queue entry
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
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(ModerationRecord::class, 'moderation_record_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isPost(): bool
    {
        return $this->content_type === 'post';
    }

    public function isComment(): bool
    {
        return $this->content_type === 'comment';
    }

    public function resolve(int $adminId, string $status, ?string $note = null): void
    {
        $this->update([
            'status' => $status,
            'resolved_by' => $adminId,
            'resolved_at' => now(),
            'resolution_note' => $note,
        ]);
    }
}
