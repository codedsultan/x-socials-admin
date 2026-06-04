import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
    FileText,
    MessageCircle,
    AlertTriangle,
    Zap,
    Filter,
} from 'lucide-react';
import { formatNumber, timeAgo, cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScanRun {
    id: number;
    status: 'running' | 'completed' | 'failed';
    statusColour: 'success' | 'danger' | 'accent' | 'white';
    mode: 'reconciliation' | 'standard' | 'manual';
    posts_scanned: number;
    comments_scanned: number;
    total_scanned: number;
    flagged: number;
    queued_for_review: number;
    total_flagged: number;
    safe: number;
    duration: string | null;
    error_message: string | null;
    started_at: string;
    finished_at: string | null;
}

interface PaginatedRuns {
    data: ScanRun[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface Summary {
    total_runs: number;
    completed: number;
    failed: number;
    running: number;
    reconciliation_runs: number;
    total_comments_scanned: number;
    total_flagged: number;
    avg_duration_seconds: number;
}

interface Props {
    runs: PaginatedRuns;
    filters: { status?: string; mode?: string };
    summary: Summary;
    lastReconciliation: {
        started_at: string;
        comments_scanned: number;
        flagged: number;
        duration: string | null;
    } | null;
}

// ── Status icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: ScanRun['status'] }) {
    if (status === 'completed')
        return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-danger" />;
    return <Loader2 className="h-4 w-4 animate-spin text-accent-400" />;
}

// ── Mode badge ────────────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: ScanRun['mode'] }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px]',
                mode === 'reconciliation'
                    ? 'border-teal-500/20 bg-teal-500/10 text-teal-400'
                    : mode === 'manual'
                      ? 'border-warning/20 bg-warning/10 text-warning'
                      : 'border-white/10 bg-white/6 text-white/40',
            )}
        >
            {mode}
        </span>
    );
}

// ── Expanded row detail ───────────────────────────────────────────────────────

function RunDetail({ run }: { run: ScanRun }) {
    const totalProcessed = run.total_scanned;
    const safeWidth = totalProcessed ? (run.safe / totalProcessed) * 100 : 0;
    const reviewWidth = totalProcessed
        ? (run.queued_for_review / totalProcessed) * 100
        : 0;
    const flaggedWidth = totalProcessed
        ? (run.flagged / totalProcessed) * 100
        : 0;

    return (
        <div className="space-y-4 border-t border-white/6 bg-white/2 px-6 py-4">
            {/* Verdict breakdown bar */}
            {totalProcessed > 0 && (
                <div className="space-y-1.5">
                    <p className="font-mono text-xs tracking-wider text-white/25 uppercase">
                        Verdict breakdown
                    </p>
                    <div className="flex h-1.5 gap-px overflow-hidden rounded-full">
                        <div
                            className="bg-success transition-all"
                            style={{ width: `${safeWidth}%` }}
                            title={`Safe: ${run.safe}`}
                        />
                        <div
                            className="bg-warning transition-all"
                            style={{ width: `${reviewWidth}%` }}
                            title={`Review: ${run.queued_for_review}`}
                        />
                        <div
                            className="bg-danger transition-all"
                            style={{ width: `${flaggedWidth}%` }}
                            title={`Remove: ${run.flagged}`}
                        />
                    </div>
                    <div className="flex gap-4 text-xs text-white/30">
                        <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            {formatNumber(run.safe)} safe
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                            {formatNumber(run.queued_for_review)} review
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                            {formatNumber(run.flagged)} remove
                        </span>
                    </div>
                </div>
            )}

            {/* Content breakdown */}
            <div className="flex gap-6 text-xs text-white/40">
                <span className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />{' '}
                    {formatNumber(run.posts_scanned)} posts
                </span>
                <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-3 w-3" />{' '}
                    {formatNumber(run.comments_scanned)} comments
                </span>
                {run.duration && (
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> {run.duration}
                    </span>
                )}
                {run.finished_at && (
                    <span className="ml-auto">
                        Finished {timeAgo(run.finished_at)}
                    </span>
                )}
            </div>

            {/* Error message */}
            {run.error_message && (
                <div className="rounded-xl border border-danger/20 bg-danger/8 px-4 py-3">
                    <p className="mb-1 flex items-center gap-1.5 font-mono text-xs tracking-wider text-danger/60 uppercase">
                        <AlertTriangle className="h-3 w-3" /> Error
                    </p>
                    <p className="font-mono text-xs leading-relaxed text-danger/80">
                        {run.error_message}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ScansIndex({
    runs,
    filters,
    summary,
    lastReconciliation,
}: Props) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [triggering, setTriggering] = useState(false);

    function applyFilter(key: string, value: string) {
        const next = { ...filters, [key]: value || undefined };
        router.get('/scans', next, { preserveState: true, replace: true });
    }

    function clearFilters() {
        router.get('/scans', {}, { preserveState: false });
    }

    function triggerScan(mode: 'reconciliation' | 'standard') {
        setTriggering(true);
        router.post(
            '/scans/trigger',
            { mode },
            {
                onFinish: () => setTriggering(false),
            },
        );
    }

    const hasFilters = !!(filters.status || filters.mode);
    const avgDuration =
        summary.avg_duration_seconds < 60
            ? `${summary.avg_duration_seconds}s`
            : `${Math.floor(summary.avg_duration_seconds / 60)}m ${summary.avg_duration_seconds % 60}s`;

    return (
        <AdminLayout title="Scan Runs">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-white">
                            Scan Runs
                        </h2>
                        <p className="mt-0.5 text-sm text-white/40">
                            History of all reconciliation and manual moderation
                            scans
                        </p>
                    </div>
                    {/* Manual trigger buttons */}
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            onClick={() => triggerScan('standard')}
                            disabled={triggering}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/80 disabled:opacity-40"
                        >
                            <Zap className="h-3.5 w-3.5" /> Standard scan
                        </button>
                        <button
                            onClick={() => triggerScan('reconciliation')}
                            disabled={triggering}
                            className="flex items-center gap-1.5 rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs text-teal-400 transition-colors hover:bg-teal-500/20 disabled:opacity-40"
                        >
                            {triggering ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Reconciliation scan
                        </button>
                    </div>
                </div>

                {/* Summary cards — last 30 days */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        {
                            label: 'Total runs',
                            value: formatNumber(summary.total_runs),
                            sub: 'last 30 days',
                            colour: 'text-white/70',
                        },
                        {
                            label: 'Success rate',
                            value:
                                summary.total_runs > 0
                                    ? `${Math.round((summary.completed / summary.total_runs) * 100)}%`
                                    : '—',
                            sub: `${summary.failed} failed`,
                            colour:
                                summary.failed > 0
                                    ? 'text-warning'
                                    : 'text-success',
                        },
                        {
                            label: 'Items scanned',
                            value: formatNumber(summary.total_comments_scanned),
                            sub: `${formatNumber(summary.total_flagged)} flagged`,
                            colour: 'text-white/70',
                        },
                        {
                            label: 'Avg duration',
                            value: summary.total_runs > 0 ? avgDuration : '—',
                            sub: 'completed runs',
                            colour: 'text-white/70',
                        },
                    ].map(({ label, value, sub, colour }) => (
                        <div
                            key={label}
                            className="glass rounded-2xl px-5 py-4"
                        >
                            <p className="mb-1 font-mono text-xs tracking-wider text-white/25 uppercase">
                                {label}
                            </p>
                            <p
                                className={cn(
                                    'font-display text-2xl font-bold',
                                    colour,
                                )}
                            >
                                {value}
                            </p>
                            <p className="mt-0.5 text-xs text-white/25">
                                {sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Last reconciliation banner */}
                {lastReconciliation && (
                    <div className="glass flex items-center gap-4 rounded-2xl border-teal-500/10 px-5 py-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10">
                            <RefreshCw className="h-4 w-4 text-teal-400" />
                        </span>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/80">
                                Last reconciliation scan ran{' '}
                                {timeAgo(lastReconciliation.started_at)}
                            </p>
                            <p className="mt-0.5 text-xs text-white/30">
                                {formatNumber(
                                    lastReconciliation.comments_scanned,
                                )}{' '}
                                items scanned ·{' '}
                                {formatNumber(lastReconciliation.flagged)}{' '}
                                flagged · {lastReconciliation.duration ?? '—'}{' '}
                                duration
                            </p>
                        </div>
                        <p className="shrink-0 font-mono text-xs text-white/20">
                            Next: 03:00 UTC
                        </p>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-white/30">
                        <Filter className="h-3 w-3" /> Filter
                    </span>

                    {(['running', 'completed', 'failed'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() =>
                                applyFilter(
                                    'status',
                                    filters.status === s ? '' : s,
                                )
                            }
                            className={cn(
                                'rounded-full border px-3 py-1 font-mono text-xs transition-colors',
                                filters.status === s
                                    ? s === 'completed'
                                        ? 'border-success/30 bg-success/15 text-success'
                                        : s === 'failed'
                                          ? 'border-danger/30 bg-danger/15 text-danger'
                                          : 'border-accent-500/30 bg-accent-500/15 text-accent-400'
                                    : 'border-white/10 bg-white/4 text-white/40 hover:text-white/60',
                            )}
                        >
                            {s}
                        </button>
                    ))}

                    <span className="mx-1 h-3 w-px bg-white/10" />

                    {(['reconciliation', 'standard', 'manual'] as const).map(
                        (m) => (
                            <button
                                key={m}
                                onClick={() =>
                                    applyFilter(
                                        'mode',
                                        filters.mode === m ? '' : m,
                                    )
                                }
                                className={cn(
                                    'rounded-full border px-3 py-1 font-mono text-xs transition-colors',
                                    filters.mode === m
                                        ? m === 'reconciliation'
                                            ? 'border-teal-500/30 bg-teal-500/15 text-teal-400'
                                            : 'border-white/20 bg-white/10 text-white/70'
                                        : 'border-white/10 bg-white/4 text-white/40 hover:text-white/60',
                                )}
                            >
                                {m}
                            </button>
                        ),
                    )}

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-xs text-white/25 transition-colors hover:text-white/50"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="glass overflow-hidden rounded-2xl">
                    {/* Column headers */}
                    <div className="grid grid-cols-[48px_1fr_112px_76px_76px_84px] gap-4 border-b border-white/8 px-6 py-3 font-mono text-xs tracking-widest text-white/25 uppercase">
                        <span>Status</span>
                        <span>Started</span>
                        <span>Mode</span>
                        <span className="text-right">Scanned</span>
                        <span className="text-right">Flagged</span>
                        <span className="text-right">Duration</span>
                    </div>

                    {runs.data.length === 0 ? (
                        <div className="py-20 text-center">
                            <RefreshCw className="mx-auto mb-3 h-8 w-8 text-white/10" />
                            <p className="text-sm text-white/30">
                                No scan runs found
                            </p>
                            {hasFilters && (
                                <p className="mt-1 text-xs text-white/20">
                                    Try clearing the filters
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {runs.data.map((run) => (
                                <div key={run.id}>
                                    {/* Main row */}
                                    <div
                                        className={cn(
                                            'grid grid-cols-[48px_1fr_112px_76px_76px_84px] gap-4 px-6 py-4',
                                            'cursor-pointer items-center transition-colors',
                                            run.status === 'failed'
                                                ? 'hover:bg-danger/5'
                                                : 'hover:bg-white/3',
                                            expandedId === run.id &&
                                                'bg-white/3',
                                        )}
                                        onClick={() =>
                                            setExpandedId(
                                                expandedId === run.id
                                                    ? null
                                                    : run.id,
                                            )
                                        }
                                    >
                                        <StatusIcon status={run.status} />

                                        <div>
                                            <p className="font-mono text-sm text-white/80">
                                                Run #{run.id}
                                            </p>
                                            <p className="mt-0.5 text-xs text-white/25">
                                                {timeAgo(run.started_at)}
                                                {run.status === 'running' && (
                                                    <span className="ml-2 animate-pulse text-accent-400">
                                                        · in progress
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        <ModeBadge mode={run.mode} />

                                        <p className="text-right font-mono text-sm text-white/60 tabular-nums">
                                            {formatNumber(run.total_scanned)}
                                        </p>

                                        <p
                                            className={cn(
                                                'text-right font-mono text-sm tabular-nums',
                                                run.total_flagged > 0
                                                    ? 'text-warning'
                                                    : 'text-white/25',
                                            )}
                                        >
                                            {run.total_flagged > 0
                                                ? formatNumber(
                                                      run.total_flagged,
                                                  )
                                                : '—'}
                                        </p>

                                        <p className="text-right font-mono text-sm text-white/40 tabular-nums">
                                            {run.duration ??
                                                (run.status === 'running'
                                                    ? '…'
                                                    : '—')}
                                        </p>
                                    </div>

                                    {/* Expanded detail */}
                                    {expandedId === run.id && (
                                        <RunDetail run={run} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {runs.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-white/8 px-6 py-4">
                            <p className="text-xs text-white/25">
                                {formatNumber(runs.total)} total runs
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        router.get('/scans', {
                                            ...filters,
                                            page: runs.current_page - 1,
                                        })
                                    }
                                    disabled={runs.current_page === 1}
                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/80 disabled:opacity-30"
                                >
                                    Previous
                                </button>
                                <span className="font-mono text-xs text-white/30">
                                    {runs.current_page} / {runs.last_page}
                                </span>
                                <button
                                    onClick={() =>
                                        router.get('/scans', {
                                            ...filters,
                                            page: runs.current_page + 1,
                                        })
                                    }
                                    disabled={
                                        runs.current_page === runs.last_page
                                    }
                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/80 disabled:opacity-30"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
