<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\InvitationRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['name', 'email', 'message', 'status', 'reviewed_by', 'reviewed_at'])]
class InvitationRequest extends Model
{
    protected function casts(): array
    {
        return [
            'status' => InvitationRequestStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function invitation(): HasOne
    {
        return $this->hasOne(Invitation::class);
    }

    public function isPending(): bool
    {
        return $this->status === InvitationRequestStatus::Pending;
    }
}
