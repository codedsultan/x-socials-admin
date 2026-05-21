<?php

declare(strict_types=1);

namespace App\Enums;

enum ModerationVerdict: string
{
    case Remove = 'remove';
    case Review = 'review';
    case Keep = 'keep';
}
