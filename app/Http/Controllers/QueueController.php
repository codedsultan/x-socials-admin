<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\ContentType;
use App\Enums\ModerationStatus;
use App\Enums\ModerationVerdict;
use App\Models\ModerationQueue;
use App\Models\ScanRun;
use App\Models\User;
use App\Services\QueueService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class QueueController extends Controller
{
    public function __construct(private readonly QueueService $queueService) {}

    public function index(Request $request): Response
    {
        $verdict = $request->query('verdict');
        $statusValue = $request->query('status', 'pending');
        $contentTypeValue = $request->query('content_type');

        $status = ModerationStatus::tryFrom($statusValue) ?? ModerationStatus::Pending;

        $paginator = ModerationQueue::query()
            ->when(
                $verdict && ModerationVerdict::tryFrom($verdict),
                fn ($q) => $q->byVerdict(ModerationVerdict::from($verdict))
            )
            ->when(
                $contentTypeValue && ContentType::tryFrom($contentTypeValue),
                fn ($q) => $q->byContentType(ContentType::from($contentTypeValue))
            )
            ->byStatus($status)
            ->orderByRaw("CASE verdict WHEN 'remove' THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'asc')
            ->paginate(25);

        return Inertia::render('Queue/Index', [
            'items' => $paginator->items(),
            'pagination' => [
                'total' => $paginator->total(),
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
            ],
            'filters' => $request->only(['verdict', 'status', 'content_type']),
            'pendingCounts' => $this->queueService->pendingCounts(),
            'lastScan' => ScanRun::finished()->latest('started_at')->first(),
        ]);
    }

    public function keep(Request $request, int $id): RedirectResponse
    {
        $item = ModerationQueue::findOrFail($id);
        $this->queueService->keep($item, $this->resolveAdmin(), $request->input('note'), (string) $request->ip());

        $label = $item->isPost() ? 'Post' : 'Comment';

        return back()->with('success', "{$label} kept — marked as reviewed.");
    }

    public function remove(Request $request, int $id): RedirectResponse
    {
        $item = ModerationQueue::findOrFail($id);
        $label = $item->isPost() ? 'post' : 'comment';

        $removed = $this->queueService->remove($item, $this->resolveAdmin(), $request->input('note'), (string) $request->ip());

        return $removed
            ? back()->with('success', ucfirst($label).' removed from the platform.')
            : back()->with('error', "Could not delete {$label} from Node API. It may have already been deleted.");
    }

    private function resolveAdmin(): User
    {
        /** @var User */
        return Auth::user();
    }
}
