import { Link, router } from '@inertiajs/react';
import {
    CheckCircle,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Clock,
    ShieldAlert,
    Filter,
    FileText,
    MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { VerdictBadge, ConfidenceBar, EmptyState } from '@/components/ui';
import AdminLayout from '@/layouts/admin-layout';
import { timeAgo, cn } from '@/lib/utils';

interface QueueItem {
    id: number;
    comment_id: string | null; // null when content_type='post'
    post_id: string;
    content_type: 'comment' | 'post';
    content_id: string; // ID of the comment or post being reviewed
    author_id: string;
    content: string;
    verdict: 'review' | 'remove';
    confidence_pct: number;
    explanation: string;
    flagged_phrases: string[];
    status: string;
    created_at: string;
}

interface Props {
    items: QueueItem[];
    pagination: {
        total: number;
        currentPage: number;
        lastPage: number;
        perPage: number;
    };
    filters: { verdict?: string; status?: string; content_type?: string };
    pendingCounts: {
        remove: number;
        review: number;
        posts_pending: number;
        comments_pending: number;
    };
    lastScan?: {
        status: string;
        comments_scanned: number;
        flagged: number;
        started_at: string;
    } | null;
}

// ── Content-type badge ─────────────────────────────────────────────────────────

function ContentTypeBadge({ type }: { type: 'comment' | 'post' }) {
    return type === 'post' ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent-500/20 bg-accent-500/10 px-2 py-0.5 font-mono text-[10px] text-accent-400">
            <FileText className="h-2.5 w-2.5" /> Post
        </span>
    ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2 py-0.5 font-mono text-[10px] text-white/40">
            <MessageCircle className="h-2.5 w-2.5" /> Comment
        </span>
    );
}

// ── Queue row ──────────────────────────────────────────────────────────────────

function QueueRow({
    item,
    onKeep,
    onRemove,
}: {
    item: QueueItem;
    onKeep: () => void;
    onRemove: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isPost = item.content_type === 'post';

    return (
        <div
            className={cn(
                'border-b border-white/5 transition-colors',
                item.verdict === 'remove'
                    ? 'bg-danger/4 hover:bg-danger/8'
                    : 'hover:bg-white/3',
            )}
        >
            <div className="grid grid-cols-[84px_76px_1fr_112px_76px_92px] items-center gap-4 px-6 py-4">
                {/* Verdict */}
                <VerdictBadge verdict={item.verdict} />

                {/* Content type */}
                <ContentTypeBadge type={item.content_type} />

                {/* Content preview */}
                <div
                    className="min-w-0 cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <p className="truncate text-sm text-white/80">
                        {item.content}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-white/25">
                        {item.author_id.slice(0, 12)}… ·{' '}
                        {timeAgo(item.created_at)}
                    </p>
                </div>

                {/* Confidence */}
                <div className="w-28 shrink-0">
                    <ConfidenceBar
                        value={item.confidence_pct / 100}
                        verdict={item.verdict}
                    />
                </div>

                {/* Keep */}
                <button
                    onClick={onKeep}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-success transition-colors hover:bg-success/20"
                >
                    <CheckCircle className="h-3.5 w-3.5" /> Keep
                </button>

                {/* Remove */}
                <button
                    onClick={onRemove}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs text-danger transition-colors hover:bg-danger/20"
                >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div className="space-y-3 border-t border-white/5 px-6 pt-4 pb-5">
                    {/* Full content */}
                    <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                        <p className="text-sm leading-relaxed text-white/70">
                            {item.content}
                        </p>
                    </div>

                    {/* AI explanation */}
                    <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                        <p className="mb-1 font-mono text-xs tracking-wider text-white/25 uppercase">
                            AI explanation
                        </p>
                        <p className="text-sm text-white/60">
                            {item.explanation}
                        </p>
                    </div>

                    {/* Flagged phrases */}
                    {item.flagged_phrases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {item.flagged_phrases.map((p) => (
                                <span
                                    key={p}
                                    className="rounded border border-danger/20 bg-danger/10 px-2 py-0.5 text-xs text-danger"
                                >
                                    &ldquo;{p}&rdquo;
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Identifiers */}
                    <p className="font-mono text-xs text-white/20">
                        {isPost
                            ? `Post: ${item.content_id}`
                            : `Comment: ${item.content_id} · Post: ${item.post_id}`}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function QueueIndex({
    items,
    pagination,
    filters,
    pendingCounts,
    lastScan,
}: Props) {
    const totalPending = pendingCounts.remove + pendingCounts.review;

    function keep(id: number) {
        router.post(`/queue/${id}/keep`, {}, { preserveScroll: true });
    }

    function remove(id: number, contentType: string) {
        const label = contentType === 'post' ? 'post' : 'comment';

        if (!confirm(`Remove this ${label} from the platform?`)) {
            return;
        }

        router.post(`/queue/${id}/remove`, {}, { preserveScroll: true });
    }

    function filterHref(extra: Record<string, string | undefined>) {
        const params = new URLSearchParams();
        const merged = { ...filters, ...extra };
        Object.entries(merged).forEach(([k, v]) => {
            if (v) {
                params.set(k, v);
            }
        });
        const qs = params.toString();

        return `/queue${qs ? `?${qs}` : ''}`;
    }

    const activeClass = 'bg-accent-500/15 border-accent-500/25 text-accent-400';
    const inactiveClass = 'glass text-white/50 hover:text-white/80';

    return (
        <AdminLayout title="Review Queue">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-white">
                            Review Queue
                        </h2>
                        <p className="mt-0.5 text-sm text-white/40">
                            AI-flagged posts and comments awaiting human
                            decision
                        </p>
                    </div>

                    {lastScan && (
                        <div className="glass shrink-0 rounded-xl px-4 py-3 font-mono text-xs text-white/30">
                            <div className="mb-1 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                Last scan: {timeAgo(lastScan.started_at)}
                            </div>
                            <div>
                                {lastScan.comments_scanned} scanned ·{' '}
                                {lastScan.flagged} flagged
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter tabs — verdict + content type + resolved */}
                <div className="flex flex-wrap gap-2">
                    {/* Verdict filters */}
                    <Link
                        href={filterHref({
                            verdict: 'remove',
                            content_type: undefined,
                        })}
                        className={cn(
                            'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all',
                            filters.verdict === 'remove' &&
                                !filters.content_type
                                ? 'border-danger/30 bg-danger/20 text-danger'
                                : inactiveClass,
                        )}
                    >
                        <span className="h-2 w-2 rounded-full bg-danger" />
                        {pendingCounts.remove} to remove
                    </Link>

                    <Link
                        href={filterHref({
                            verdict: 'review',
                            content_type: undefined,
                        })}
                        className={cn(
                            'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all',
                            filters.verdict === 'review' &&
                                !filters.content_type
                                ? 'border-warning/30 bg-warning/20 text-warning'
                                : inactiveClass,
                        )}
                    >
                        <span className="h-2 w-2 rounded-full bg-warning" />
                        {pendingCounts.review} to review
                    </Link>

                    <Link
                        href="/queue"
                        className={cn(
                            'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all',
                            !filters.verdict && !filters.content_type
                                ? activeClass
                                : inactiveClass,
                        )}
                    >
                        All ({totalPending})
                    </Link>

                    {/* Divider */}
                    <span className="mx-1 w-px self-stretch bg-white/8" />

                    {/* Content-type filters */}
                    <Link
                        href={filterHref({
                            content_type: 'post',
                            verdict: undefined,
                        })}
                        className={cn(
                            'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-all',
                            filters.content_type === 'post'
                                ? activeClass
                                : inactiveClass,
                        )}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Posts ({pendingCounts.posts_pending})
                    </Link>

                    <Link
                        href={filterHref({
                            content_type: 'comment',
                            verdict: undefined,
                        })}
                        className={cn(
                            'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-all',
                            filters.content_type === 'comment'
                                ? activeClass
                                : inactiveClass,
                        )}
                    >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Comments ({pendingCounts.comments_pending})
                    </Link>

                    {/* Resolved */}
                    <Link
                        href="/queue?status=reviewed"
                        className="glass ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-white/30 transition-all hover:text-white/60"
                    >
                        <Filter className="h-3.5 w-3.5" /> View resolved
                    </Link>
                </div>

                {/* Queue table */}
                <div className="glass overflow-hidden rounded-2xl">
                    <div className="grid grid-cols-[84px_76px_1fr_112px_76px_92px] gap-4 border-b border-white/8 px-6 py-3 font-mono text-xs tracking-widest text-white/25 uppercase">
                        <span>Verdict</span>
                        <span>Type</span>
                        <span>Content</span>
                        <span>Confidence</span>
                        <span />
                        <span />
                    </div>

                    {items.length === 0 ? (
                        <EmptyState
                            icon={<ShieldAlert className="h-10 w-10" />}
                            title="Queue is empty"
                            message={
                                filters.content_type
                                    ? `No pending ${filters.content_type}s in the queue`
                                    : filters.verdict
                                      ? `No pending ${filters.verdict} items`
                                      : 'No items pending review — great work!'
                            }
                        />
                    ) : (
                        items.map((item) => (
                            <QueueRow
                                key={item.id}
                                item={item}
                                onKeep={() => keep(item.id)}
                                onRemove={() =>
                                    remove(item.id, item.content_type)
                                }
                            />
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination.lastPage > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="font-mono text-xs text-white/25">
                            {pagination.total} items · page{' '}
                            {pagination.currentPage} of {pagination.lastPage}
                        </p>
                        <div className="flex gap-2">
                            {[
                                {
                                    page: pagination.currentPage - 1,
                                    label: 'Previous',
                                    icon: ChevronLeft,
                                    disabled: pagination.currentPage <= 1,
                                },
                                {
                                    page: pagination.currentPage + 1,
                                    label: 'Next',
                                    icon: ChevronRight,
                                    disabled:
                                        pagination.currentPage >=
                                        pagination.lastPage,
                                },
                            ].map(({ page, label, icon: Icon, disabled }) => (
                                <Link
                                    key={label}
                                    href={filterHref({ page: String(page) })}
                                    className={cn(
                                        'glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all',
                                        disabled
                                            ? 'pointer-events-none opacity-30'
                                            : 'text-white/60 hover:border-white/20',
                                    )}
                                >
                                    {label === 'Previous' && (
                                        <Icon className="h-3.5 w-3.5" />
                                    )}
                                    {label}
                                    {label === 'Next' && (
                                        <Icon className="h-3.5 w-3.5" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
