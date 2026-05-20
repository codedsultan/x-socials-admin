import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { VerdictBadge, ConfidenceBar, EmptyState, Skeleton } from '@/components/ui';
import {
    ShieldAlert, Search, Trash2, CheckCircle,
    AlertTriangle, Zap, X, FileText, MessageCircle,
} from 'lucide-react';
import { timeAgo, cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
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
    analysis: Record<string, ModerationResult>;
}

// ── Analysis modal — works for both posts and comments ─────────────────────────

function AnalysisModal({
    contentId,
    contentType,
    content,
    authorId,
    createdAt,
    preloaded,
    onClose,
    onDelete,
}: {
    contentId: string;
    contentType: 'post' | 'comment';
    content: string;
    authorId: string;
    createdAt: string;
    preloaded?: ModerationResult;
    onClose: () => void;
    onDelete: (id: string, type: 'post' | 'comment') => void;
}) {
    const [analysing, setAnalysing] = useState(!preloaded);
    const [analysis, setAnalysis] = useState<ModerationResult | undefined>(preloaded);

    useEffect(() => {
        if (preloaded) return;
        fetch('/moderation/analyse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name=csrf-token]') as HTMLMetaElement)?.content ?? '',
            },
            body: JSON.stringify({ id: contentId, content, authorId, content_type: contentType }),
        })
            .then(r => r.json())
            .then(data => { setAnalysis(data); setAnalysing(false); })
            .catch(() => setAnalysing(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentId]);

    const verdict = analysis?.verdict;
    const label = contentType === 'post' ? 'Post' : 'Comment';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg glass rounded-2xl shadow-2xl animate-slide-up overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                    <div className="flex items-center gap-2.5">
                        {contentType === 'post'
                            ? <FileText className="h-4.5 w-4.5 text-accent-400" />
                            : <ShieldAlert className="h-4.5 w-4.5 text-accent-400" />
                        }
                        <span className="font-display font-semibold text-sm text-white/90">
                            {label} Analysis
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Content preview */}
                    <div className="bg-white/4 rounded-xl px-4 py-3 border border-white/8 max-h-32 overflow-y-auto">
                        <p className="text-sm text-white/75 leading-relaxed">{content}</p>
                        <div className="flex items-center gap-3 mt-2.5 text-xs text-white/25 font-mono">
                            <span>{authorId.slice(0, 12)}…</span>
                            <span>·</span>
                            <span>{timeAgo(createdAt)}</span>
                        </div>
                    </div>

                    {/* AI analysis result */}
                    {analysing ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-accent-400">
                                <Zap className="h-3.5 w-3.5 animate-pulse" /> Analysing with AI…
                            </div>
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ) : analysis ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-white/30 font-mono uppercase tracking-wider mb-1.5">AI verdict</p>
                                    {verdict && <VerdictBadge verdict={verdict} />}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/30 font-mono uppercase tracking-wider mb-1.5">Confidence</p>
                                    <div className="w-36">
                                        {verdict && <ConfidenceBar value={analysis.confidence} verdict={verdict} />}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/3 rounded-xl px-4 py-3 border border-white/8">
                                <p className="text-xs font-mono uppercase tracking-wider text-white/25 mb-1.5">Explanation</p>
                                <p className="text-sm text-white/70 leading-relaxed">{analysis.explanation}</p>
                            </div>

                            {analysis.categories.length > 0 && (
                                <div>
                                    <p className="text-xs font-mono uppercase tracking-wider text-white/25 mb-2">Categories</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {analysis.categories.map(c => (
                                            <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-white/6 border border-white/10 text-white/50">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysis.flaggedPhrases.length > 0 && (
                                <div className="bg-danger/8 rounded-xl px-4 py-3 border border-danger/20">
                                    <p className="text-xs font-mono uppercase tracking-wider text-danger/60 mb-2 flex items-center gap-1.5">
                                        <AlertTriangle className="h-3 w-3" /> Flagged phrases
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {analysis.flaggedPhrases.map(p => (
                                            <span key={p} className="px-2 py-0.5 rounded text-xs bg-danger/10 text-danger border border-danger/20">&ldquo;{p}&rdquo;</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-white/30">Analysis unavailable</p>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between gap-3">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
                    >
                        <CheckCircle className="h-4 w-4 text-success" /> Keep {label.toLowerCase()}
                    </button>
                    <button
                        onClick={() => { onDelete(contentId, contentType); onClose(); }}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-danger/15 border border-danger/25 text-danger hover:bg-danger/25 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" /> Remove {label.toLowerCase()}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ModerationIndex({ postId, post, comments, meta, analysis }: Props) {
    const [postIdInput, setPostIdInput] = useState(postId);
    const [selected, setSelected] = useState<{ id: string; type: 'post' | 'comment'; content: string; authorId: string; createdAt: string } | null>(null);

    function loadPost(e: React.FormEvent) {
        e.preventDefault();
        router.get('/moderation', { postId: postIdInput }, { preserveState: false });
    }

    function deleteContent(id: string, type: 'post' | 'comment') {
        const path = type === 'post' ? `/moderation/posts/${id}` : `/moderation/comments/${id}`;
        router.delete(path, { preserveScroll: true, onSuccess: () => setSelected(null) });
    }

    const flagCount = Object.values(analysis).filter(r => r.verdict === 'remove').length;
    const reviewCount = Object.values(analysis).filter(r => r.verdict === 'review').length;

    return (
        <AdminLayout title="Moderation">
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-white">On-demand Moderation</h2>
                        <p className="text-sm text-white/40 mt-0.5">
                            Paste a Post ID to analyse the post and all its comments
                        </p>
                    </div>
                    {(post || comments.length > 0) && (
                        <div className="flex gap-3 text-xs font-mono shrink-0">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-danger/10 border border-danger/20 text-danger">
                                <span className="h-1.5 w-1.5 rounded-full bg-danger" /> {flagCount} to remove
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning/10 border border-warning/20 text-warning">
                                <span className="h-1.5 w-1.5 rounded-full bg-warning" /> {reviewCount} to review
                            </span>
                        </div>
                    )}
                </div>

                {/* Post ID input */}
                <form onSubmit={loadPost} className="flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                        <input
                            value={postIdInput}
                            onChange={e => setPostIdInput(e.target.value)}
                            placeholder="Paste a Post ObjectId (MongoDB)…"
                            className="w-full pl-8 pr-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder:text-white/20 font-mono focus:outline-none focus:border-accent-500/50"
                        />
                    </div>
                    <button type="submit" className="flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-xl bg-accent-500/15 border border-accent-500/25 text-accent-400 hover:bg-accent-500/25 transition-colors">
                        <Zap className="h-3.5 w-3.5" /> Analyse
                    </button>
                </form>

                {/* Results */}
                {postId && (
                    <div className="glass rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] text-xs font-mono uppercase tracking-widest text-white/30 px-6 py-3 border-b border-white/8 gap-4">
                            <span>Type</span>
                            <span>Content</span>
                            <span>Verdict</span>
                            <span>Confidence</span>
                            <span />
                        </div>

                        {/* Post row (if found) */}
                        {post && (() => {
                            const result = analysis[post.id];
                            const verdict = result?.verdict;
                            const previewContent = `Title: ${post.title}\n\nBody:\n${post.content}`;
                            return (
                                <div
                                    key={post.id}
                                    className={cn(
                                        'grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-6 py-4 transition-colors cursor-pointer group border-b border-white/5',
                                        verdict === 'remove' ? 'bg-danger/5 hover:bg-danger/10' :
                                            verdict === 'review' ? 'bg-warning/5 hover:bg-warning/10' :
                                                'bg-accent-500/3 hover:bg-accent-500/6'
                                    )}
                                    onClick={() => setSelected({ id: post.id, type: 'post', content: previewContent, authorId: post.authorId, createdAt: post.createdAt })}
                                >
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent-500/10 border border-accent-500/20 text-accent-400 shrink-0">
                                        <FileText className="h-2.5 w-2.5" /> Post
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm text-white/80 font-medium truncate">{post.title}</p>
                                        <p className="text-xs text-white/25 font-mono mt-0.5">{post.authorId.slice(0, 12)}… · {timeAgo(post.createdAt)}</p>
                                    </div>
                                    <div className="shrink-0">
                                        {verdict ? <VerdictBadge verdict={verdict} /> : <span className="text-xs text-white/20 font-mono">—</span>}
                                    </div>
                                    <div className="w-28 shrink-0">
                                        {result && verdict && <ConfidenceBar value={result.confidence} verdict={verdict} />}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => deleteContent(post.id, 'post')}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger/15 text-white/25 hover:text-danger transition-all"
                                            title="Delete post"
                                        ><Trash2 className="h-3.5 w-3.5" /></button>
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
                            <div className="px-6 py-5 text-sm text-white/30 italic">No comments on this post yet.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {comments.map(comment => {
                                    const result = analysis[comment.id];
                                    const verdict = result?.verdict;
                                    return (
                                        <div
                                            key={comment.id}
                                            className={cn(
                                                'grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-6 py-4 transition-colors cursor-pointer group',
                                                verdict === 'remove' ? 'bg-danger/5 hover:bg-danger/10' :
                                                    verdict === 'review' ? 'bg-warning/5 hover:bg-warning/10' :
                                                        'hover:bg-white/3'
                                            )}
                                            onClick={() => setSelected({ id: comment.id, type: 'comment', content: comment.content, authorId: comment.authorId, createdAt: comment.createdAt })}
                                        >
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/6 border border-white/10 text-white/40 shrink-0">
                                                <MessageCircle className="h-2.5 w-2.5" /> Comment
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm text-white/80 truncate">{comment.content}</p>
                                                <p className="text-xs text-white/25 font-mono mt-0.5">{comment.authorId.slice(0, 12)}… · {timeAgo(comment.createdAt)}</p>
                                            </div>
                                            <div className="shrink-0">
                                                {verdict ? <VerdictBadge verdict={verdict} /> : <span className="text-xs text-white/20 font-mono">—</span>}
                                            </div>
                                            <div className="w-28 shrink-0">
                                                {result && verdict && <ConfidenceBar value={result.confidence} verdict={verdict} />}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => deleteContent(comment.id, 'comment')}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger/15 text-white/25 hover:text-danger transition-all"
                                                    title="Delete comment"
                                                ><Trash2 className="h-3.5 w-3.5" /></button>
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
                    <div className="glass rounded-2xl py-20 flex flex-col items-center gap-4 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                            <ShieldAlert className="h-7 w-7 text-accent-400/50" />
                        </div>
                        <div>
                            <p className="font-medium text-white/50">Enter a Post ID to begin</p>
                            <p className="text-sm text-white/25 mt-1">
                                Copy an ID from the Posts page, paste it above and click Analyse
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
                    preloaded={analysis[selected.id]}
                    onClose={() => setSelected(null)}
                    onDelete={deleteContent}
                />
            )}
        </AdminLayout>
    );
}
