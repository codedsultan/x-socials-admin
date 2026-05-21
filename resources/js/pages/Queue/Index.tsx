import { Link, router } from '@inertiajs/react';
import {
    CheckCircle, Trash2, ChevronLeft, ChevronRight,
    Clock, ShieldAlert, Filter, FileText, MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { VerdictBadge, ConfidenceBar, EmptyState } from '@/components/ui';
import AdminLayout from '@/layouts/admin-layout';
import { timeAgo, cn } from '@/lib/utils';

interface QueueItem {
    id: number;
    comment_id: string | null;   // null when content_type='post'
    post_id: string;
    content_type: 'comment' | 'post';
    content_id: string;          // ID of the comment or post being reviewed
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
    pagination: { total: number; currentPage: number; lastPage: number; perPage: number };
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent-500/10 border border-accent-500/20 text-accent-400 shrink-0">
            <FileText className="h-2.5 w-2.5" /> Post
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/6 border border-white/10 text-white/40 shrink-0">
            <MessageCircle className="h-2.5 w-2.5" /> Comment
        </span>
    );
}

// ── Queue row ──────────────────────────────────────────────────────────────────

function QueueRow({ item, onKeep, onRemove }: {
    item: QueueItem;
    onKeep: () => void;
    onRemove: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isPost = item.content_type === 'post';

    return (
        <div className={cn(
            'border-b border-white/5 transition-colors',
            item.verdict === 'remove' ? 'bg-danger/4 hover:bg-danger/8' : 'hover:bg-white/3'
        )}>
            <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-4 px-6 py-4">
                {/* Verdict */}
                <VerdictBadge verdict={item.verdict} />

                {/* Content type */}
                <ContentTypeBadge type={item.content_type} />

                {/* Content preview */}
                <div className="min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                    <p className="text-sm text-white/80 truncate">{item.content}</p>
                    <p className="text-xs text-white/25 font-mono mt-0.5">
                        {item.author_id.slice(0, 12)}… · {timeAgo(item.created_at)}
                    </p>
                </div>

                {/* Confidence */}
                <div className="w-28 shrink-0">
                    <ConfidenceBar value={item.confidence_pct / 100} verdict={item.verdict} />
                </div>

                {/* Keep */}
                <button
                    onClick={onKeep}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-success/10 border border-success/20 text-success hover:bg-success/20 transition-colors shrink-0"
                >
                    <CheckCircle className="h-3.5 w-3.5" /> Keep
                </button>

                {/* Remove */}
                <button
                    onClick={onRemove}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition-colors shrink-0"
                >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div className="px-6 pb-5 space-y-3 border-t border-white/5 pt-4">
                    {/* Full content */}
                    <div className="bg-white/4 rounded-xl px-4 py-3 border border-white/8">
                        <p className="text-sm text-white/70 leading-relaxed">{item.content}</p>
                    </div>

                    {/* AI explanation */}
                    <div className="bg-white/3 rounded-xl px-4 py-3 border border-white/8">
                        <p className="text-xs font-mono uppercase tracking-wider text-white/25 mb-1">AI explanation</p>
                        <p className="text-sm text-white/60">{item.explanation}</p>
                    </div>

                    {/* Flagged phrases */}
                    {item.flagged_phrases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {item.flagged_phrases.map(p => (
                                <span key={p} className="px-2 py-0.5 rounded text-xs bg-danger/10 text-danger border border-danger/20">
                                    &ldquo;{p}&rdquo;
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Identifiers */}
                    <p className="text-xs text-white/20 font-mono">
                        {isPost
                            ? `Post: ${item.content_id}`
                            : `Comment: ${item.content_id} · Post: ${item.post_id}`
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function QueueIndex({ items, pagination, filters, pendingCounts, lastScan }: Props) {
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
                        <h2 className="font-display text-2xl font-bold text-white">Review Queue</h2>
                        <p className="text-sm text-white/40 mt-0.5">
                            AI-flagged posts and comments awaiting human decision
                        </p>
                    </div>

                    {lastScan && (
                        <div className="glass rounded-xl px-4 py-3 text-xs font-mono text-white/30 shrink-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Clock className="h-3 w-3" />
                                Last scan: {timeAgo(lastScan.started_at)}
                            </div>
                            <div>{lastScan.comments_scanned} scanned · {lastScan.flagged} flagged</div>
                        </div>
                    )}
                </div>

                {/* Filter tabs — verdict + content type + resolved */}
                <div className="flex flex-wrap gap-2">
                    {/* Verdict filters */}
                    <Link href={filterHref({ verdict: 'remove', content_type: undefined })}
                        className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all',
                            filters.verdict === 'remove' && !filters.content_type ? 'bg-danger/20 border-danger/30 text-danger' : inactiveClass
                        )}
                    >
                        <span className="h-2 w-2 rounded-full bg-danger" />
                        {pendingCounts.remove} to remove
                    </Link>

                    <Link href={filterHref({ verdict: 'review', content_type: undefined })}
                        className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all',
                            filters.verdict === 'review' && !filters.content_type ? 'bg-warning/20 border-warning/30 text-warning' : inactiveClass
                        )}
                    >
                        <span className="h-2 w-2 rounded-full bg-warning" />
                        {pendingCounts.review} to review
                    </Link>

                    <Link href="/queue"
                        className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all',
                            !filters.verdict && !filters.content_type ? activeClass : inactiveClass
                        )}
                    >
                        All ({totalPending})
                    </Link>

                    {/* Divider */}
                    <span className="w-px bg-white/8 self-stretch mx-1" />

                    {/* Content-type filters */}
                    <Link href={filterHref({ content_type: 'post', verdict: undefined })}
                        className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all',
                            filters.content_type === 'post' ? activeClass : inactiveClass
                        )}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Posts ({pendingCounts.posts_pending})
                    </Link>

                    <Link href={filterHref({ content_type: 'comment', verdict: undefined })}
                        className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all',
                            filters.content_type === 'comment' ? activeClass : inactiveClass
                        )}
                    >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Comments ({pendingCounts.comments_pending})
                    </Link>

                    {/* Resolved */}
                    <Link href="/queue?status=reviewed"
                        className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs glass text-white/30 hover:text-white/60 transition-all"
                    >
                        <Filter className="h-3.5 w-3.5" /> View resolved
                    </Link>
                </div>

                {/* Queue table */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-4 text-xs font-mono uppercase tracking-widest text-white/25 px-6 py-3 border-b border-white/8">
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
                        items.map(item => (
                            <QueueRow
                                key={item.id}
                                item={item}
                                onKeep={() => keep(item.id)}
                                onRemove={() => remove(item.id, item.content_type)}
                            />
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination.lastPage > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-white/25 font-mono">
                            {pagination.total} items · page {pagination.currentPage} of {pagination.lastPage}
                        </p>
                        <div className="flex gap-2">
                            {[
                                { page: pagination.currentPage - 1, label: 'Previous', icon: ChevronLeft, disabled: pagination.currentPage <= 1 },
                                { page: pagination.currentPage + 1, label: 'Next', icon: ChevronRight, disabled: pagination.currentPage >= pagination.lastPage },
                            ].map(({ page, label, icon: Icon, disabled }) => (
                                <Link
                                    key={label}
                                    href={filterHref({ page: String(page) })}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg glass transition-all',
                                        disabled ? 'opacity-30 pointer-events-none' : 'hover:border-white/20 text-white/60'
                                    )}
                                >
                                    {label === 'Previous' && <Icon className="h-3.5 w-3.5" />}
                                    {label}
                                    {label === 'Next' && <Icon className="h-3.5 w-3.5" />}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
