import { Link, router } from '@inertiajs/react';
import {
    FileText,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Eye,
    Heart,
    Loader2,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import { Badge, EmptyState } from '@/components/ui';
import AdminLayout from '@/layouts/admin-layout';
import { timeAgo, truncate, formatNumber, cn } from '@/lib/utils';
import type { Post, PageMeta } from '@/types';

interface Props {
    posts: Post[];
    meta: PageMeta;
    page: number;
    filters: { tag?: string; authorId?: string };
}

export default function PostsIndex({ posts, meta, page, filters }: Props) {
    const [tagInput, setTagInput] = useState(filters.tag ?? '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    function applyTag(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            '/posts',
            { tag: tagInput || undefined, page: 1 },
            { preserveState: true },
        );
    }

    function deletePost(id: string) {
        if (!confirm('Delete this post permanently?')) {
            return;
        }

        setDeletingId(id);
        router.delete(`/posts/${id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    }

    return (
        <AdminLayout title="Posts">
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-white">
                            Posts
                        </h2>
                        <p className="mt-0.5 text-sm text-white/40">
                            {meta.total != null
                                ? `${formatNumber(meta.total)} posts`
                                : 'All platform posts'}
                        </p>
                    </div>

                    {/* Tag filter */}
                    <form
                        onSubmit={applyTag}
                        className="flex items-center gap-2"
                    >
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                            <input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="Filter by tag…"
                                className="w-44 rounded-xl border border-white/10 bg-white/5 py-2 pr-3 pl-8 text-sm text-white/80 placeholder:text-white/25 focus:border-accent-500/50 focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl border border-accent-500/25 bg-accent-500/15 px-3 py-2 text-xs text-accent-400 transition-colors hover:bg-accent-500/25"
                        >
                            Filter
                        </button>
                        {filters.tag && (
                            <Link
                                href="/posts"
                                className="rounded-xl px-3 py-2 text-xs text-white/40 transition-colors hover:text-white/70"
                            >
                                Clear
                            </Link>
                        )}
                    </form>
                </div>

                <div className="glass overflow-hidden rounded-2xl">
                    <div className="grid grid-cols-[1fr_140px_60px_104px_60px] gap-4 border-b border-white/8 px-6 py-3 font-mono text-xs tracking-widest text-white/30 uppercase">
                        <span>Post</span>
                        <span>Tags</span>
                        <span>Likes</span>
                        <span>Created</span>
                        <span />
                    </div>

                    {posts.length === 0 ? (
                        <EmptyState
                            icon={<FileText className="h-10 w-10" />}
                            title="No posts found"
                        />
                    ) : (
                        <div className="divide-y divide-white/5">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="group grid grid-cols-[1fr_140px_60px_104px_60px] items-center gap-4 px-6 py-4 transition-colors hover:bg-white/3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white/90">
                                            {post.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-white/30">
                                            {truncate(post.content, 80)}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-end gap-1">
                                        {post.tags.slice(0, 2).map((t) => (
                                            <Badge key={t} variant="accent">
                                                #{t}
                                            </Badge>
                                        ))}
                                        {post.tags.length > 2 && (
                                            <Badge>
                                                +{post.tags.length - 2}
                                            </Badge>
                                        )}
                                    </div>

                                    <span className="flex items-center gap-1 text-xs text-white/40">
                                        <Heart className="h-3 w-3" />{' '}
                                        {post.likesCount}
                                    </span>

                                    <span className="font-mono text-xs whitespace-nowrap text-white/30">
                                        {timeAgo(post.createdAt)}
                                    </span>

                                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Link
                                            href={`/posts/${post.id}`}
                                            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/8 hover:text-white/80"
                                            title="View"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </Link>
                                        <button
                                            onClick={() => deletePost(post.id)}
                                            disabled={deletingId === post.id}
                                            className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-danger/15 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                                            title="Delete"
                                        >
                                            {deletingId === post.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {meta.totalPages && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="font-mono text-xs text-white/30">
                            Page {page} of {meta.totalPages}
                        </p>
                        <div className="flex gap-2">
                            {[
                                {
                                    href: `/posts?page=${page - 1}${filters.tag ? `&tag=${filters.tag}` : ''}`,
                                    label: 'Previous',
                                    icon: ChevronLeft,
                                    disabled: page <= 1,
                                },
                                {
                                    href: `/posts?page=${page + 1}${filters.tag ? `&tag=${filters.tag}` : ''}`,
                                    label: 'Next',
                                    icon: ChevronRight,
                                    disabled: !meta.hasMore,
                                },
                            ].map(({ href, label, icon: Icon, disabled }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className={cn(
                                        'glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all',
                                        disabled
                                            ? 'pointer-events-none opacity-30'
                                            : 'text-white/70 hover:border-white/20',
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
