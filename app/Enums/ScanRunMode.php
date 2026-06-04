<?php

declare(strict_types=1);

namespace App\Enums;

enum ScanRunMode: string
{
    case Reconciliation = 'reconciliation';
    case Standard = 'standard';
    case Manual = 'manual';
}
