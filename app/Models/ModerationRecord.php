<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ModerationRecord extends Model
{
    protected $fillable = [
        'comment_id',
        'post_id',
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

    /** The queue entry created from this record, if any */
    public function queueItem(): HasOne
    {
        return $this->hasOne(ModerationQueue::class, 'moderation_record_id');
    }

    /** Convenience: confidence as a 0.0–1.0 float */
    public function confidenceFloat(): float
    {
        return $this->confidence_pct / 100;
    }
}
