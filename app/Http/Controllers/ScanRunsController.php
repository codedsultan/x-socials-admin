<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ScanRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ScanRunsController
 *
 * Paginated history of all moderation scan executions.
 * Scan runs are written by FastAPI (ScanService) and read here.
 *
 * Routes:
 *   GET  /scans           → index()   paginated history
 *   POST /scans/trigger   → trigger() fire a manual reconciliation scan
 */
class ScanRunsController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status');   // running | completed | failed
        $mode = $request->query('mode');     // reconciliation | standard | manual

        // ── Paginated scan run history ─────────────────────────────────────
        $runs = ScanRun::query()
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($mode, fn ($q) => $q->where('mode', $mode))
            ->orderBy('started_at', 'desc')
            ->paginate(20)
            ->through(fn (ScanRun $run) => [
                'id' => $run->id,
                'status' => $run->status,
                'statusColour' => $run->statusColour(),
                'mode' => $run->mode ?? 'reconciliation',
                'posts_scanned' => $run->posts_scanned,
                'comments_scanned' => $run->comments_scanned,
                'total_scanned' => $run->totalScanned(),
                'flagged' => $run->flagged,
                'queued_for_review' => $run->queued_for_review,
                'total_flagged' => $run->totalFlagged(),
                'safe' => $run->safe,
                'duration' => $run->durationForHumans(),
                'error_message' => $run->error_message,
                'started_at' => $run->started_at?->toISOString(),
                'finished_at' => $run->finished_at?->toISOString(),
            ]);

        // ── Summary stats for the header cards ────────────────────────────
        // Scoped to last 30 days so the numbers stay meaningful over time.
        $summary = ScanRun::query()
            ->recent(30)
            ->selectRaw("
                COUNT(*)                                    AS total_runs,
                SUM(status = 'completed')                   AS completed,
                SUM(status = 'failed')                      AS failed,
                SUM(status = 'running')                     AS running,
                SUM(mode = 'reconciliation')                AS reconciliation_runs,
                COALESCE(SUM(comments_scanned), 0)          AS total_comments_scanned,
                COALESCE(SUM(flagged + queued_for_review), 0) AS total_flagged,
                COALESCE(AVG(
                    CASE WHEN status = 'completed'
                         THEN TIMESTAMPDIFF(SECOND, started_at, finished_at)
                    END
                ), 0)                                       AS avg_duration_seconds
            ")
            ->first();

        // ── Last successful reconciliation run ─────────────────────────────
        $lastReconciliation = ScanRun::reconciliation()
            ->completed()
            ->latest('started_at')
            ->first();

        return Inertia::render('Scans/Index', [
            'runs' => $runs,
            'filters' => compact('status', 'mode'),
            'summary' => [
                'total_runs' => (int) ($summary->total_runs ?? 0),
                'completed' => (int) ($summary->completed ?? 0),
                'failed' => (int) ($summary->failed ?? 0),
                'running' => (int) ($summary->running ?? 0),
                'reconciliation_runs' => (int) ($summary->reconciliation_runs ?? 0),
                'total_comments_scanned' => (int) ($summary->total_comments_scanned ?? 0),
                'total_flagged' => (int) ($summary->total_flagged ?? 0),
                'avg_duration_seconds' => (int) round($summary->avg_duration_seconds ?? 0),
            ],
            'lastReconciliation' => $lastReconciliation ? [
                'started_at' => $lastReconciliation->started_at?->toISOString(),
                'comments_scanned' => $lastReconciliation->comments_scanned,
                'flagged' => $lastReconciliation->totalFlagged(),
                'duration' => $lastReconciliation->durationForHumans(),
            ] : null,
        ]);
    }

    /**
     * Trigger a manual reconciliation scan via FastAPI.
     * The result (scan_run_id) is returned as a flash message.
     */
    public function trigger(Request $request): RedirectResponse
    {
        $mode = $request->input('mode', 'reconciliation');

        try {
            $response = Http::timeout(30)
                ->baseUrl(config('services.moderator.url', 'http://localhost:8001'))
                ->post('/scan/trigger', ['mode' => $mode]);

            if ($response->failed()) {
                return back()->with('error',
                    "FastAPI returned {$response->status()} — check moderator logs."
                );
            }

            $runId = $response->json('scan_run_id');

            return back()->with('success',
                "Scan started (run_id={$runId}, mode={$mode}). Results appear here as it completes."
            );

        } catch (\Throwable $e) {
            return back()->with('error',
                "Could not reach FastAPI moderator: {$e->getMessage()}"
            );
        }
    }
}
