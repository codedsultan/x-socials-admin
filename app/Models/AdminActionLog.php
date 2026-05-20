<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminActionLog extends Model
{
    public const UPDATED_AT = null; // append-only

    protected $fillable = [
        'actor_id',
        'actor_email',
        'actor_name',
        'action',
        'target_type',
        'target_id',
        'meta',
        'ip',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'actor_id');
    }

    /**
     * Record an admin action from a typed AdminUser model.
     *
     * @param  array<string,mixed>  $meta
     */
    public static function record(
        AdminUser $actor,
        string    $action,
        string    $targetType,
        string    $targetId,
        array     $meta  = [],
        ?string   $ip    = null,
    ): self {
        return static::create([
            'actor_id'    => $actor->id,
            'actor_email' => $actor->email,
            'actor_name'  => $actor->name,
            'action'      => $action,
            'target_type' => $targetType,
            'target_id'   => $targetId,
            'meta'        => $meta,
            'ip'          => $ip,
        ]);
    }
}
