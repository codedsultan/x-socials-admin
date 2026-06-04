import { router } from '@inertiajs/react';
import {
    ShieldAlert,
    Search,
    Trash2,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Zap,
    X,
    FileText,
    MessageCircle,
    Clock,
    RefreshCw,
    Database,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    VerdictBadge,
    ConfidenceBar,
    EmptyState,
    Skeleton,
} from '@/components/ui';
import AdminLayout from '@/layouts/admin-layout';
import { timeAgo, cn } from '@/lib/utils';
import type { ModerationResult, PageMeta } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    createdAt: string;
}

interface Comment {
    id: string;
    content: string;
    authorId: string;
    createdAt: string;
}

interface Props {
    postId: string;
    post: Post | null;
    comments: Comment[];
    meta: PageMeta;
    // [Fix 5] analysis values are now ModerationResult | null.
    // null means the content has not yet been scanned by the background pipeline.
    analysis: Record<string, ModerationResult | null>;
}

// ── Cache source badge ─────────────────────────────────────────────────────────
//
// Shows where the analysis result came from so admins understand freshness.
// fromCache=true  → result is from the background scan (moderation_records DB)
// fromCache=false → result is from a live AI call triggered in this session

function SourceBadge({ result }: { result: ModerationResult }) {
    if (result.fromCache) {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2 py-0.5 font-mono text-[10px] text-white/30"
                title={
                    result.analysedAt
                        ? `Scanned ${timeAgo(result.analysedAt)}`
                        : 'From background scan'
                }
            >
                <Database className="h-2.5 w-2.5" />
                {result.analysedAt ? timeAgo(result.analysedAt) : 'Cached'}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-accent-500/20 bg-accent-500/10 px-2 py-0.5 font-mono text-[10px] text-accent-400">
            <Zap className="h-2.5 w-2.5" />
            Live
        </span>
    );
}

// ── Analysis modal ────────────────────────────────────────────────────────────

function AnalysisModal({
    contentId,
    contentType,
    content,
    authorId,
    createdAt,
    preloaded,
    isDeleting = false,
    onClose,
    onDelete,
}: {
    contentId: string;
    contentType: 'post' | 'comment';
    content: string;
    authorId: string;
    createdAt: string;
    // [Fix 5] preloaded is now ModerationResult | null | undefined.
    // null  → content not yet scanned; trigger a fresh analysis immediately.
    // value → show stored result; offer Re-analyse button for upgrade.
    preloaded?: ModerationResult | null;
    isDeleting?: boolean;
    onClose: () => void;
    onDelete: (id: string, type: 'post' | 'comment') => void;
}) {
    const [analysing, setAnalysing] = useState(preloaded == null);
    const [analysis, setAnalysis] = useState<ModerationResult | null>(
        preloaded ?? null,
    );
    // forceModel allows the admin to re-run with a more powerful model.
    const [forceModel, setForceModel] = useState<string | null>(null);

    const label = contentType === 'post' ? 'Post' : 'Comment';

    function runAnalysis(model?: string) {
        setAnalysing(true);
        fetch('/moderation/analyse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    (
                        document.querySelector(
                            'meta[name=csrf-token]',
                        ) as HTMLMetaElement
                    )?.content ?? '',
            },
            body: JSON.stringify({
                id: contentId,
                content,
                authorId,
                content_type: contentType,
                ...(model ? { force_model: model } : {}),
            }),
        })
            .then((r) => r.json())
            .then((data) => {
                setAnalysis(data);
                setAnalysing(false);
            })
            .catch(() => setAnalysing(false));
    }

    // Trigger a fresh analysis when there is no stored result.
    // State is already initialised to `analysing=true` when preloaded==null,
    // so we only need to update state inside async callbacks here.
    useEffect(() => {
        if (preloaded != null) {
            return;
        }

        let cancelled = false;
        const csrfToken =
            (document.querySelector('meta[name=csrf-token]') as HTMLMetaElement)
                ?.content ?? '';

        fetch('/moderation/analyse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({
                id: contentId,
                content,
                authorId,
                content_type: contentType,
            }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled) {
                    setAnalysis(data);
                    setAnalysing(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setAnalysing(false);
                }
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentId]);

    const verdict = analysis?.verdict;

    return (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="glass animate-slide-up w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        {contentType === 'post' ? (
                            <FileText className="h-4.5 w-4.5 text-accent-400" />
                        ) : (
                            <ShieldAlert className="h-4.5 w-4.5 text-accent-400" />
                        )}
                        <span className="font-display text-sm font-semibold text-white/90">
                            {label} Analysis
                        </span>
                        {/* Show source badge when we have a result */}
                        {analysis && !analysing && (
                            <SourceBadge result={analysis} />
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/8 hover:text-white/70"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                    {/* Content preview */}
                    <div className="max-h-32 overflow-y-auto rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                        <p className="text-sm leading-relaxed text-white/75">
                            {content}
                        </p>
                        <div className="mt-2.5 flex items-center gap-3 font-mono text-xs text-white/25">
                            <span>{authorId.slice(0, 12)}…</span>
                            <span>·</span>
                            <span>{timeAgo(createdAt)}</span>
                        </div>
                    </div>

                    {/* AI analysis result */}
                    {analysing ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-accent-400">
                                <Zap className="h-3.5 w-3.5 animate-pulse" />
                                {forceModel
                                    ? `Re-analysing with ${forceModel}…`
                                    : 'Analysing with AI…'}
                            </div>
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ) : analysis ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1.5 font-mono text-xs tracking-wider text-white/30 uppercase">
                                        AI verdict
                                    </p>
                                    {verdict && (
                                        <VerdictBadge verdict={verdict} />
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="mb-1.5 font-mono text-xs tracking-wider text-white/30 uppercase">
                                        Confidence
                                    </p>
                                    <div className="w-36">
                                        {verdict && (
                                            <ConfidenceBar
                                                value={analysis.confidence}
                                                verdict={verdict}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                                <p className="mb-1.5 font-mono text-xs tracking-wider text-white/25 uppercase">
                                    Explanation
                                </p>
                                <p className="text-sm leading-relaxed text-white/70">
                                    {analysis.explanation}
                                </p>
                            </div>

                            {analysis.categories.length > 0 && (
                                <div>
                                    <p className="mb-2 font-mono text-xs tracking-wider text-white/25 uppercase">
                                        Categories
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {analysis.categories.map((c) => (
                                            <span
                                                key={c}
                                                className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-xs text-white/50"
                                            >
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysis.flaggedPhrases.length > 0 && (
                                <div className="rounded-xl border border-danger/20 bg-danger/8 px-4 py-3">
                                    <p className="mb-2 flex items-center gap-1.5 font-mono text-xs tracking-wider text-danger/60 uppercase">
                                        <AlertTriangle className="h-3 w-3" />{' '}
                                        Flagged phrases
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {analysis.flaggedPhrases.map((p) => (
                                            <span
                                                key={p}
                                                className="rounded border border-danger/20 bg-danger/10 px-2 py-0.5 text-xs text-danger"
                                            >
                                                &ldquo;{p}&rdquo;
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* [Fix 5] Re-analyse section — only shown for cached results.
                                Gives the admin a way to get a fresh, higher-quality verdict
                                when they disagree with what the background scan produced.
                                The model dropdown maps to the force_model query param that
                                ModerationController.analyse() passes to ModeratorService. */}
                            {analysis.fromCache && (
                                <div className="border-t border-white/8 pt-4">
                                    <p className="mb-2 flex items-center gap-1.5 font-mono text-xs tracking-wider text-white/25 uppercase">
                                        <Clock className="h-3 w-3" />
                                        Scanned{' '}
                                        {analysis.analysedAt
                                            ? timeAgo(analysis.analysedAt)
                                            : 'earlier'}
                                        {analysis.model && (
                                            <span className="ml-1 opacity-60">
                                                · {analysis.model}
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={forceModel ?? ''}
                                            onChange={(e) =>
                                                setForceModel(
                                                    e.target.value || null,
                                                )
                                            }
                                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/60 focus:border-accent-500/50 focus:outline-none"
                                        >
                                            <option value="">
                                                Re-analyse with…
                                            </option>
                                            <option value="anthropic/claude-haiku-3-5">
                                                Haiku 3.5 (fast)
                                            </option>
                                            <option value="anthropic/claude-sonnet-4-5">
                                                Sonnet 4.5 (best)
                                            </option>
                                            <option value="mistralai/mistral-nemo">
                                                Mistral Nemo (cheap)
                                            </option>
                                        </select>
                                        <button
                                            onClick={() =>
                                                runAnalysis(
                                                    forceModel ?? undefined,
                                                )
                                            }
                                            disabled={analysing}
                                            className="flex items-center gap-1.5 rounded-lg border border-accent-500/20 bg-accent-500/10 px-3 py-1.5 text-xs text-accent-400 transition-colors hover:bg-accent-500/20 disabled:opacity-40"
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                            Re-analyse
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // This branch is only reached if the API call itself failed
                        <p className="text-sm text-white/30">
                            Analysis unavailable — try Re-analyse above.
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 border-t border-white/8 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
                    >
                        <CheckCircle className="h-4 w-4 text-success" /> Keep{' '}
                        {label.toLowerCase()}
                    </button>
                    <button
                        onClick={() => onDelete(contentId, contentType)}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 rounded-xl border border-danger/25 bg-danger/15 px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        {isDeleting
                            ? 'Removing…'
                            : `Remove ${label.toLowerCase()}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ModerationIndex({
    postId,
    post,
    comments,
    analysis,
}: Props) {
    const [postIdInput, setPostIdInput] = useState(postId);
    const [selected, setSelected] = useState<{
        id: string;
        type: 'post' | 'comment';
        content: string;
        authorId: string;
        createdAt: string;
    } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    function loadPost(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            '/moderation',
            { postId: postIdInput },
            { preserveState: false },
        );
    }

    function deleteContent(id: string, type: 'post' | 'comment') {
        const path =
            type === 'post'
                ? `/moderation/posts/${id}`
                : `/moderation/comments/${id}`;
        setDeletingId(id);
        router.delete(path, {
            preserveScroll: true,
            onSuccess: () => setSelected(null),
            onFinish: () => setDeletingId(null),
        });
    }

    // [Fix 5] analysis values can now be null — guard before filtering.
    const results = Object.values(analysis).filter(
        (r): r is ModerationResult => r !== null,
    );
    const flagCount = results.filter((r) => r.verdict === 'remove').length;
    const reviewCount = results.filter((r) => r.verdict === 'review').length;
    // Count how many items still have no scan result (pending background scan).
    const pendingCount = Object.values(analysis).filter(
        (r) => r === null,
    ).length;

    return (
        <AdminLayout title="Moderation">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-white">
                            On-demand Moderation
                        </h2>
                        <p className="mt-0.5 text-sm text-white/40">
                            Paste a Post ID to review the post and all its
                            comments
                        </p>
                    </div>
                    {(post || comments.length > 0) && (
                        <div className="flex shrink-0 flex-wrap gap-3 font-mono text-xs">
                            <span className="flex items-center gap-1.5 rounded-xl border border-danger/20 bg-danger/10 px-3 py-1.5 text-danger">
                                <span className="h-1.5 w-1.5 rounded-full bg-danger" />{' '}
                                {flagCount} to remove
                            </span>
                            <span className="flex items-center gap-1.5 rounded-xl border border-warning/20 bg-warning/10 px-3 py-1.5 text-warning">
                                <span className="h-1.5 w-1.5 rounded-full bg-warning" />{' '}
                                {reviewCount} to review
                            </span>
                            {/* [Fix 5] Show pending count when background scan hasn't reached some content */}
                            {pendingCount > 0 && (
                                <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/6 px-3 py-1.5 text-white/40">
                                    <Clock className="h-3 w-3" /> {pendingCount}{' '}
                                    pending scan
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Post ID input */}
                <form onSubmit={loadPost} className="flex gap-2">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                        <input
                            value={postIdInput}
                            onChange={(e) => setPostIdInput(e.target.value)}
                            placeholder="Paste a Post ObjectId (MongoDB)…"
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-8 font-mono text-sm text-white/80 placeholder:text-white/20 focus:border-accent-500/50 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="flex items-center gap-1.5 rounded-xl border border-accent-500/25 bg-accent-500/15 px-4 py-2.5 text-sm text-accent-400 transition-colors hover:bg-accent-500/25"
                    >
                        <Zap className="h-3.5 w-3.5" /> Load
                    </button>
                </form>

                {/* Results table */}
                {postId && (
                    <div className="glass overflow-hidden rounded-2xl">
                        <div className="grid grid-cols-[80px_1fr_84px_112px_36px] gap-4 border-b border-white/8 px-6 py-3 font-mono text-xs tracking-widest text-white/30 uppercase">
                            <span>Type</span>
                            <span>Content</span>
                            <span>Verdict</span>
                            <span>Confidence</span>
                            <span />
                        </div>

                        {/* Post row */}
                        {post &&
                            (() => {
                                const result = analysis[post.id]; // ModerationResult | null | undefined
                                const verdict = result?.verdict;
                                const previewContent = `Title: ${post.title}\n\nBody:\n${post.content}`;

                                return (
                                    <div
                                        key={post.id}
                                        className={cn(
                                            'grid grid-cols-[80px_1fr_84px_112px_36px] items-center gap-4 px-6 py-4',
                                            'group cursor-pointer border-b border-white/5 transition-colors',
                                            verdict === 'remove'
                                                ? 'bg-danger/5 hover:bg-danger/10'
                                                : verdict === 'review'
                                                  ? 'bg-warning/5 hover:bg-warning/10'
                                                  : 'bg-accent-500/3 hover:bg-accent-500/6',
                                        )}
                                        onClick={() =>
                                            setSelected({
                                                id: post.id,
                                                type: 'post',
                                                content: previewContent,
                                                authorId: post.authorId,
                                                createdAt: post.createdAt,
                                            })
                                        }
                                    >
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent-500/20 bg-accent-500/10 px-2 py-0.5 font-mono text-[10px] text-accent-400">
                                            <FileText className="h-2.5 w-2.5" />{' '}
                                            Post
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white/80">
                                                {post.title}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs text-white/25">
                                                {post.authorId.slice(0, 12)}… ·{' '}
                                                {timeAgo(post.createdAt)}
                                            </p>
                                        </div>
                                        {/* [Fix 5] null result → "Pending" pill instead of dash */}
                                        <div className="shrink-0">
                                            {result === null ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/25">
                                                    <Clock className="h-2.5 w-2.5" />{' '}
                                                    Pending
                                                </span>
                                            ) : verdict ? (
                                                <VerdictBadge
                                                    verdict={verdict}
                                                />
                                            ) : (
                                                <span className="font-mono text-xs text-white/20">
                                                    —
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-28 shrink-0">
                                            {result && verdict && (
                                                <ConfidenceBar
                                                    value={result.confidence}
                                                    verdict={verdict}
                                                />
                                            )}
                                        </div>
                                        <div
                                            className="flex shrink-0 items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() =>
                                                    deleteContent(
                                                        post.id,
                                                        'post',
                                                    )
                                                }
                                                className="rounded-lg p-1.5 text-white/25 opacity-0 transition-all group-hover:opacity-100 hover:bg-danger/15 hover:text-danger"
                                                title="Delete post"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                        {/* Comment rows */}
                        {comments.length === 0 && !post ? (
                            <EmptyState
                                icon={<ShieldAlert className="h-10 w-10" />}
                                title="Post not found"
                                message="Check the Post ID and try again"
                            />
                        ) : comments.length === 0 ? (
                            <div className="px-6 py-5 text-sm text-white/30 italic">
                                No comments on this post yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {comments.map((comment) => {
                                    const result = analysis[comment.id];
                                    const verdict = result?.verdict;

                                    return (
                                        <div
                                            key={comment.id}
                                            className={cn(
                                                'grid grid-cols-[80px_1fr_84px_112px_36px] items-center gap-4 px-6 py-4',
                                                'group cursor-pointer transition-colors',
                                                verdict === 'remove'
                                                    ? 'bg-danger/5 hover:bg-danger/10'
                                                    : verdict === 'review'
                                                      ? 'bg-warning/5 hover:bg-warning/10'
                                                      : 'hover:bg-white/3',
                                            )}
                                            onClick={() =>
                                                setSelected({
                                                    id: comment.id,
                                                    type: 'comment',
                                                    content: comment.content,
                                                    authorId: comment.authorId,
                                                    createdAt:
                                                        comment.createdAt,
                                                })
                                            }
                                        >
                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2 py-0.5 font-mono text-[10px] text-white/40">
                                                <MessageCircle className="h-2.5 w-2.5" />{' '}
                                                Comment
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm text-white/80">
                                                    {comment.content}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs text-white/25">
                                                    {comment.authorId.slice(
                                                        0,
                                                        12,
                                                    )}
                                                    … ·{' '}
                                                    {timeAgo(comment.createdAt)}
                                                </p>
                                            </div>
                                            {/* [Fix 5] null result → "Pending" pill */}
                                            <div className="shrink-0">
                                                {result === null ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/25">
                                                        <Clock className="h-2.5 w-2.5" />{' '}
                                                        Pending
                                                    </span>
                                                ) : verdict ? (
                                                    <VerdictBadge
                                                        verdict={verdict}
                                                    />
                                                ) : (
                                                    <span className="font-mono text-xs text-white/20">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                            <div className="w-28 shrink-0">
                                                {result && verdict && (
                                                    <ConfidenceBar
                                                        value={
                                                            result.confidence
                                                        }
                                                        verdict={verdict}
                                                    />
                                                )}
                                            </div>
                                            <div
                                                className="flex shrink-0 items-center gap-1"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <button
                                                    onClick={() =>
                                                        deleteContent(
                                                            comment.id,
                                                            'comment',
                                                        )
                                                    }
                                                    className="rounded-lg p-1.5 text-white/25 opacity-0 transition-all group-hover:opacity-100 hover:bg-danger/15 hover:text-danger"
                                                    title="Delete comment"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state when no post entered */}
                {!postId && (
                    <div className="glass flex flex-col items-center gap-4 rounded-2xl py-20 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-500/20 bg-accent-500/10">
                            <ShieldAlert className="h-7 w-7 text-accent-400/50" />
                        </div>
                        <div>
                            <p className="font-medium text-white/50">
                                Enter a Post ID to begin
                            </p>
                            <p className="mt-1 text-sm text-white/25">
                                Copy an ID from the Posts page, paste it above
                                and click Load
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Analysis modal */}
            {selected && (
                <AnalysisModal
                    contentId={selected.id}
                    contentType={selected.type}
                    content={selected.content}
                    authorId={selected.authorId}
                    createdAt={selected.createdAt}
                    preloaded={analysis[selected.id] ?? null}
                    isDeleting={deletingId === selected.id}
                    onClose={() => setSelected(null)}
                    onDelete={deleteContent}
                />
            )}
        </AdminLayout>
    );
}
