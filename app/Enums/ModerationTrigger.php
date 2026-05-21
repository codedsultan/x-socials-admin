<?php

declare(strict_types=1);

namespace App\Enums;

enum ModerationTrigger: string
{
    case Realtime = 'realtime';
    case Auto = 'auto';
    case Manual = 'manual';
}
