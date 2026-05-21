<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AdminAction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminActionLog extends Model
{
    public const UPDATED_AT = null;

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
        return $this->belongsTo(User::class, 'actor_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeByAction(Builder $query, AdminAction|string $action): Builder
    {
        $value = $action instanceof AdminAction ? $action->value : $action;

        return $query->where('action', $value);
    }

    public function scopeByActorId(Builder $query, int $actorId): Builder
    {
        return $query->where('actor_id', $actorId);
    }

    // ── Factory method ────────────────────────────────────────────────────────

    /**
     * @param  array<string,mixed>  $meta
     */
    public static function record(
        User $actor,
        AdminAction $action,
        string $targetType,
        string $targetId,
        array $meta = [],
        ?string $ip = null,
    ): self {
        return static::create([
            'actor_id' => $actor->id,
            'actor_email' => $actor->email,
            'actor_name' => $actor->name,
            'action' => $action->value,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'meta' => $meta,
            'ip' => $ip,
        ]);
    }
}
