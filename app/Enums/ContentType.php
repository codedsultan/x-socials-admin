<?php

declare(strict_types=1);

namespace App\Enums;

enum ContentType: string
{
    case Post = 'post';
    case Comment = 'comment';
}
