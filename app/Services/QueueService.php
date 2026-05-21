<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AdminAction;
use App\Enums\ModerationStatus;
use App\Models\AdminActionLog;
use App\Models\ModerationQueue;
use App\Models\User;

class QueueService
{
    public function __construct(
        private readonly XSocialsApiService $api,
    ) {}

    /**
     * @return array{remove: int, review: int, posts_pending: int, comments_pending: int}
     */
    public function pendingCounts(): array
    {
        $rows = ModerationQueue::query()
            ->pending()
            ->selectRaw('verdict, content_type, COUNT(*) as cnt')
            ->groupBy('verdict', 'content_type')
            ->get();

        $counts = ['remove' => 0, 'review' => 0, 'posts_pending' => 0, 'comments_pending' => 0];

        foreach ($rows as $row) {
            $counts[$row->verdict->value] = ($counts[$row->verdict->value] ?? 0) + (int) $row->cnt;

            $typeKey = $row->content_type->value.'s_pending';
            $counts[$typeKey] = ($counts[$typeKey] ?? 0) + (int) $row->cnt;
        }

        return $counts;
    }

    public function keep(ModerationQueue $item, User $admin, ?string $note, string $ip): void
    {
        $item->resolve($admin->id, ModerationStatus::Reviewed, $note);

        AdminActionLog::record(
            actor: $admin,
            action: AdminAction::DismissQueueItem,
            targetType: $item->content_type->value,
            targetId: $item->content_id,
            meta: [
                'verdict' => $item->verdict->value,
                'queue_id' => $item->id,
                'content_type' => $item->content_type->value,
            ],
            ip: $ip,
        );
    }

    public function remove(ModerationQueue $item, User $admin, ?string $note, string $ip): bool
    {
        $deleted = $item->isPost()
            ? $this->api->deletePost($item->content_id)
            : $this->api->deleteComment($item->content_id);

        if (! $deleted) {
            return false;
        }

        $item->resolve($admin->id, ModerationStatus::Removed, $note);

        AdminActionLog::record(
            actor: $admin,
            action: AdminAction::ResolveQueueItem,
            targetType: $item->content_type->value,
            targetId: $item->content_id,
            meta: [
                'verdict' => $item->verdict->value,
                'confidence_pct' => $item->confidence_pct,
                'queue_id' => $item->id,
                'content_type' => $item->content_type->value,
            ],
            ip: $ip,
        );

        return true;
    }
}
