<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\ModeratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ScanController extends Controller
{
    public function __construct(private readonly ModeratorService $moderator) {}

    public function trigger(Request $request): RedirectResponse
    {
        $result = $this->moderator->triggerScan(postId: null, forceModel: $request->input('model'));

        if (! $result['started']) {
            return back()->with('error', 'Could not start scan: '.($result['message'] ?? 'Moderator unavailable'));
        }

        return back()->with('success', "Scan started (run #{$result['scan_run_id']}). Results will appear in the queue shortly.");
    }

    public function triggerPost(Request $request, string $postId): RedirectResponse
    {
        $result = $this->moderator->triggerScan(postId: $postId, forceModel: $request->input('model'));

        if (! $result['started']) {
            return back()->with('error', 'Could not start scan: '.($result['message'] ?? 'Moderator unavailable'));
        }

        return redirect()
            ->route('queue.index', ['postId' => $postId])
            ->with('success', "Scan started for this post (run #{$result['scan_run_id']}). Results appear in the queue below.");
    }
}
