import AdminLayout from '@/layouts/admin-layout';
import { Link, router } from '@inertiajs/react';
import { VerdictBadge, ConfidenceBar, EmptyState } from '@/components/ui';
import {
    CheckCircle, Trash2, ChevronLeft, ChevronRight,
    Clock, ShieldAlert, Filter,
} from 'lucide-react';
import { timeAgo, cn } from '@/lib/utils';
import { useState } from 'react';

interface QueueItem {
    id: number;
    comment_id: string;
    post_id: string;
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
    filters: { verdict?: string; status?: string };
    pendingCounts: { remove: number; review: number };
    lastScan?: { status: string; comments_scanned: number; flagged: number; started_at: string } | null;
}

function QueueRow({ item, onKeep, onRemove }: { item: QueueItem; onKeep: () => void; onRemove: () => void }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={cn(
            'border-b border-white/5 transition-colors',
            item.verdict === 'remove' ? 'bg-danger/4 hover:bg-danger/8' : 'hover:bg-white/3'
        )}>
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-6 py-4">
                {/* Verdict */}
                <VerdictBadge verdict={item.verdict} />

                {/* Content */}
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

                {/* Actions */}
                <button
                    onClick={onKeep}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-success/10 border border-success/20 text-success hover:bg-success/20 transition-colors shrink-0"
                >
                    <CheckCircle className="h-3.5 w-3.5" /> Keep
                </button>
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
                    <div className="bg-white/4 rounded-xl px-4 py-3 border border-white/8">
                        <p className="text-sm text-white/70 leading-relaxed">{item.content}</p>
                    </div>
                    <div className="bg-white/3 rounded-xl px-4 py-3 border border-white/8">
                        <p className="text-xs font-mono uppercase tracking-wider text-white/25 mb-1">AI explanation</p>
                        <p className="text-sm text-white/60">{item.explanation}</p>
                    </div>
                    {item.flagged_phrases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {item.flagged_phrases.map(p => (
                                <span key={p} className="px-2 py-0.5 rounded text-xs bg-danger/10 text-danger border border-danger/20">
                                    "{p}"
                                </span>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-white/20 font-mono">
                        Comment: {item.comment_id} · Post: {item.post_id}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function QueueIndex({ items, pagination, filters, pendingCounts, lastScan }: Props) {
    function keep(id: number) {
        router.post(`/queue/${id}/keep`, {}, { preserveScroll: true });
    }
    function remove(id: number) {
        if (!confirm('Remove this comment from the platform?')) return;
        router.post(`/queue/${id}/remove`, {}, { preserveScroll: true });
    }

    return (
        <AdminLayout title="Review Queue">
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-white">Review Queue</h2>
                        <p className="text-sm text-white/40 mt-0.5">
                            AI-flagged comments awaiting human decision
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

                {/* Count badges */}
                <div className="flex gap-3">
                    <Link
                        href="/queue?verdict=remove"
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all',
                            filters.verdict === 'remove'
                                ? 'bg-danger/20 border-danger/30 text-danger'
                                : 'glass text-white/50 hover:text-white/80'
                        )}
                    >
                        <span className="h-2 w-2 rounded-full bg-danger" />
                        {pendingCounts.remove} to remove
                    </Link>
                    <Link
                        href="/queue?verdict=review"
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all',
                            filters.verdict === 'review'
                                ? 'bg-warning/20 border-warning/30 text-warning'
                                : 'glass text-white/50 hover:text-white/80'
                        )}
                    >
                        <span className="h-2 w-2 rounded-full bg-warning" />
                        {pendingCounts.review} to review
                    </Link>
                    <Link
                        href="/queue"
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all',
                            !filters.verdict
                                ? 'bg-accent-500/15 border-accent-500/25 text-accent-400'
                                : 'glass text-white/50 hover:text-white/80'
                        )}
                    >
                        All ({pendingCounts.remove + pendingCounts.review})
                    </Link>
                    <Link
                        href="/queue?status=reviewed"
                        className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs glass text-white/30 hover:text-white/60 transition-all"
                    >
                        <Filter className="h-3.5 w-3.5" /> View resolved
                    </Link>
                </div>

                {/* Queue table */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 text-xs font-mono uppercase tracking-widest text-white/25 px-6 py-3 border-b border-white/8">
                        <span>Verdict</span>
                        <span>Comment</span>
                        <span>Confidence</span>
                        <span />
                        <span />
                    </div>

                    {items.length === 0 ? (
                        <EmptyState
                            icon={<ShieldAlert className="h-10 w-10" />}
                            title="Queue is empty"
                            message={filters.verdict ? `No pending ${filters.verdict} items` : 'No items pending review — great work!'}
                        />
                    ) : (
                        items.map(item => (
                            <QueueRow
                                key={item.id}
                                item={item}
                                onKeep={() => keep(item.id)}
                                onRemove={() => remove(item.id)}
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
                                    href={`/queue?page=${page}${filters.verdict ? `&verdict=${filters.verdict}` : ''}`}
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
