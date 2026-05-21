<?php

declare(strict_types=1);

namespace App\Enums;

enum ModerationStatus: string
{
    case Pending = 'pending';
    case Reviewed = 'reviewed';
    case Removed = 'removed';
    case AutoRemoved = 'auto_removed';
}
