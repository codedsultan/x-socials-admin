<?php

declare(strict_types=1);

namespace App\Enums;

enum ScanRunStatus: string
{
    case Running = 'running';
    case Completed = 'completed';
    case Failed = 'failed';
}
