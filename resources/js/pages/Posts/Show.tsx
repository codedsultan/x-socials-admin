import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    Trash2,
    ShieldAlert,
    Zap,
} from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import AdminLayout from '@/layouts/admin-layout';
import { timeAgo, formatDate } from '@/lib/utils';
import type { Post, Comment, PageMeta } from '@/types';

interface Props {
    post: Post;
    comments: Comment[];
    meta: PageMeta;
}

export default function PostShow({ post, comments, meta }: Props) {
    function deletePost() {
        if (!confirm('Delete this post?')) {
            return;
        }

        router.delete(`/posts/${post.id}`);
    }

    function deleteComment(id: string) {
        if (!confirm('Delete this comment?')) {
            return;
        }

        router.delete(`/moderation/comments/${id}`, { preserveScroll: true });
    }

    return (
        <AdminLayout title={post.title}>
            <div className="max-w-3xl space-y-8">
                <div className="flex items-center justify-between">
                    <Link
                        href="/posts"
                        className="inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to Posts
                    </Link>
                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                router.post(`/scan/trigger/${post.id}`)
                            }
                            className="bg-accent-500/15 border-accent-500/25 text-accent-400 hover:bg-accent-500/25 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors"
                        >
                            <Zap className="h-3.5 w-3.5" /> Scan comments
                        </button>
                        <Link
                            href={`/moderation?postId=${post.id}`}
                            className="bg-warning/10 border-warning/20 text-warning hover:bg-warning/20 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors"
                        >
                            <ShieldAlert className="h-3.5 w-3.5" /> On-demand
                            analysis
                        </Link>
                        <button
                            onClick={deletePost}
                            className="bg-danger/10 border-danger/20 text-danger hover:bg-danger/20 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Delete post
                        </button>
                    </div>
                </div>

                {/* Post card */}
                <div className="glass space-y-5 rounded-2xl p-8">
                    <h2 className="font-display text-2xl leading-snug font-bold text-white">
                        {post.title}
                    </h2>

                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/60">
                        {post.content}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((t) => (
                            <Badge key={t} variant="accent">
                                #{t}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex items-center gap-5 border-t border-white/8 pt-4 font-mono text-xs text-white/30">
                        <span className="flex items-center gap-1.5">
                            <Heart className="h-3.5 w-3.5" /> {post.likesCount}{' '}
                            likes
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5" />{' '}
                            {meta.total ?? 0} comments
                        </span>
                        <span>Posted {formatDate(post.createdAt)}</span>
                        <span className="truncate">
                            Author: {post.authorId.slice(0, 16)}…
                        </span>
                    </div>
                </div>

                {/* Comments */}
                <div>
                    <h3 className="font-display mb-4 flex items-center gap-2 font-semibold text-white/80">
                        <MessageCircle className="h-4 w-4 text-white/30" />
                        Comments
                        <span className="font-mono text-xs text-white/20">
                            ({meta.total ?? comments.length})
                        </span>
                    </h3>

                    {comments.length === 0 ? (
                        <EmptyState
                            icon={<MessageCircle className="h-8 w-8" />}
                            title="No comments"
                        />
                    ) : (
                        <div className="space-y-2">
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="group glass flex items-start gap-4 rounded-xl px-5 py-4"
                                >
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-xs font-bold text-white/40">
                                        {comment.authorId[0]?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="font-mono text-xs text-white/30">
                                                {comment.authorId.slice(0, 16)}…
                                            </span>
                                            {comment.parentId && (
                                                <Badge variant="default">
                                                    reply
                                                </Badge>
                                            )}
                                            <span className="ml-auto text-xs text-white/20">
                                                {timeAgo(comment.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed text-white/70">
                                            {comment.content}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            deleteComment(comment.id)
                                        }
                                        className="hover:bg-danger/15 hover:text-danger shrink-0 rounded-lg p-1.5 text-white/25 opacity-0 transition-all group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
