<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Services\ModeratorService;

/**
 * ScanController
 *
 * Handles manual scan trigger requests from the admin UI.
 * Delegates to ModeratorService::triggerScan() which calls FastAPI.
 *
 * FastAPI does the actual work — reads MongoDB, runs Claude, writes
 * moderation_records and moderation_queue to our database.
 *
 * The admin remains in control: trigger is a deliberate human action,
 * and auto-enforcement still requires the auto-remove scheduler to run.
 */
class ScanController extends Controller
{
    public function __construct(private readonly ModeratorService $moderator) {}

    /**
     * Trigger a full platform scan.
     * Called from the dashboard "Run scan now" button.
     */
    public function trigger(Request $request): RedirectResponse
    {
        $model  = $request->input('model');    // optional: override Claude model
        $result = $this->moderator->triggerScan(postId: null, forceModel: $model);

        if (!$result['started']) {
            return back()->with('error', 'Could not start scan: ' . ($result['message'] ?? 'Moderator unavailable'));
        }

        return back()->with('success',
            "Scan started (run #{$result['scan_run_id']}). Results will appear in the queue shortly."
        );
    }

    /**
     * Trigger a scan scoped to a single post.
     * Called from the post detail page "Scan comments" button.
     */
    public function triggerPost(Request $request, string $postId): RedirectResponse
    {
        $model  = $request->input('model');
        $result = $this->moderator->triggerScan(postId: $postId, forceModel: $model);

        if (!$result['started']) {
            return back()->with('error', 'Could not start scan: ' . ($result['message'] ?? 'Moderator unavailable'));
        }

        return redirect()
            ->route('queue.index', ['postId' => $postId])
            ->with('success', "Scan started for this post (run #{$result['scan_run_id']}). Results appear in the queue below.");
    }
}
