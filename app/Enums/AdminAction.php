<?php

declare(strict_types=1);

namespace App\Enums;

enum AdminAction: string
{
    case DeletePost = 'delete_post';
    case DeleteComment = 'delete_comment';
    case DismissQueueItem = 'dismiss_queue_item';
    case ResolveQueueItem = 'resolve_queue_item';
    case AutoRemove = 'auto_remove';
}
