<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ModerationRecord extends Model
{
    protected $fillable = [
        'comment_id',        // null when content_type='post'
        'post_id',
        'content_type',      // 'comment' | 'post'
        'content_id',        // ID of the comment or post being analysed
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
        'categories'      => 'array',
        'flagged_phrases' => 'array',
        'confidence_pct'  => 'integer',
    ];

    public function queueItem(): HasOne
    {
        return $this->hasOne(ModerationQueue::class, 'moderation_record_id');
    }

    public function confidenceFloat(): float
    {
        return $this->confidence_pct / 100;
    }

    public function isPost(): bool    { return $this->content_type === 'post'; }
    public function isComment(): bool { return $this->content_type === 'comment'; }
}
