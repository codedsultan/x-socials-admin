import { Link, router } from '@inertiajs/react';
import {
    FileText, ChevronLeft, ChevronRight,
    Trash2, Eye, Heart, Search,
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

    function applyTag(e: React.FormEvent) {
        e.preventDefault();
        router.get('/posts', { tag: tagInput || undefined, page: 1 }, { preserveState: true });
    }

    function deletePost(id: string) {
        if (!confirm('Delete this post permanently?')) {
return;
}

        router.delete(`/posts/${id}`, { preserveScroll: true });
    }

    return (
        <AdminLayout title="Posts">
            <div className="space-y-6">

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-white">Posts</h2>
                        <p className="text-sm text-white/40 mt-0.5">
                            {meta.total != null ? `${formatNumber(meta.total)} posts` : 'All platform posts'}
                        </p>
                    </div>

                    {/* Tag filter */}
                    <form onSubmit={applyTag} className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                            <input
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                placeholder="Filter by tag…"
                                className="pl-8 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder:text-white/25 focus:outline-none focus:border-accent-500/50 w-44"
                            />
                        </div>
                        <button type="submit" className="px-3 py-2 text-xs rounded-xl bg-accent-500/15 text-accent-400 border border-accent-500/25 hover:bg-accent-500/25 transition-colors">
                            Filter
                        </button>
                        {filters.tag && (
                            <Link href="/posts" className="px-3 py-2 text-xs rounded-xl text-white/40 hover:text-white/70 transition-colors">
                                Clear
                            </Link>
                        )}
                    </form>
                </div>

                <div className="glass rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] text-xs font-mono uppercase tracking-widest text-white/30 px-6 py-3 border-b border-white/8 gap-4">
                        <span>Post</span>
                        <span>Tags</span>
                        <span>Likes</span>
                        <span>Created</span>
                        <span />
                    </div>

                    {posts.length === 0 ? (
                        <EmptyState icon={<FileText className="h-10 w-10" />} title="No posts found" />
                    ) : (
                        <div className="divide-y divide-white/5">
                            {posts.map(post => (
                                <div key={post.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white/90 truncate">{post.title}</p>
                                        <p className="text-xs text-white/30 mt-0.5">{truncate(post.content, 80)}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {post.tags.slice(0, 2).map(t => (
                                            <Badge key={t} variant="accent">#{t}</Badge>
                                        ))}
                                        {post.tags.length > 2 && (
                                            <Badge>+{post.tags.length - 2}</Badge>
                                        )}
                                    </div>

                                    <span className="flex items-center gap-1 text-xs text-white/40">
                                        <Heart className="h-3 w-3" /> {post.likesCount}
                                    </span>

                                    <span className="text-xs text-white/30 font-mono whitespace-nowrap">
                                        {timeAgo(post.createdAt)}
                                    </span>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/posts/${post.id}`}
                                            className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80 transition-colors"
                                            title="View"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </Link>
                                        <button
                                            onClick={() => deletePost(post.id)}
                                            className="p-1.5 rounded-lg hover:bg-danger/15 text-white/30 hover:text-danger transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
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
                        <p className="text-xs text-white/30 font-mono">Page {page} of {meta.totalPages}</p>
                        <div className="flex gap-2">
                            {[
                                { href: `/posts?page=${page - 1}${filters.tag ? `&tag=${filters.tag}` : ''}`, label: 'Previous', icon: ChevronLeft, disabled: page <= 1 },
                                { href: `/posts?page=${page + 1}${filters.tag ? `&tag=${filters.tag}` : ''}`, label: 'Next', icon: ChevronRight, disabled: !meta.hasMore },
                            ].map(({ href, label, icon: Icon, disabled }) => (
                                <Link key={label} href={href} className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg glass transition-all',
                                    disabled ? 'opacity-30 pointer-events-none' : 'hover:border-white/20 text-white/70'
                                )}>
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
