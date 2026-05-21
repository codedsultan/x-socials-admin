import { Link } from '@inertiajs/react';
import { ArrowLeft, FileText, Users, Heart } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import AdminLayout from '@/layouts/admin-layout';
import { timeAgo, formatDate, formatNumber, truncate } from '@/lib/utils';
import type { XUser as User, Post, PageMeta } from '@/types';

interface Props {
    user: User;
    posts: Post[];
    meta: PageMeta;
}

export default function UserShow({ user, posts, meta }: Props) {
    return (
        <AdminLayout title={user.name ?? 'User'}>
            <div className="max-w-3xl space-y-8">
                <Link
                    href="/users"
                    className="inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
                </Link>

                {/* Profile card */}
                <div className="glass space-y-6 rounded-2xl p-8">
                    <div className="flex items-start gap-5">
                        <div className="bg-accent-500/20 border-accent-500/30 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border">
                            <span className="font-display text-accent-400 text-2xl font-bold">
                                {(user.name ??
                                    user.email ??
                                    '?')[0]?.toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-display text-xl font-bold text-white">
                                {user.name ?? '—'}
                            </h2>
                            <p className="mt-0.5 text-sm text-white/40">
                                {user.email ?? '—'}
                            </p>
                            <p className="mt-1 font-mono text-xs text-white/25">
                                {user.id}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-white/8 pt-4">
                        {[
                            {
                                icon: Users,
                                label: 'Followers',
                                value: formatNumber(user.followerCount),
                            },
                            {
                                icon: Users,
                                label: 'Following',
                                value: formatNumber(user.followingCount),
                            },
                            {
                                icon: FileText,
                                label: 'Posts',
                                value: formatNumber(meta.total),
                            },
                        ].map(({ label, value }) => (
                            <div key={label} className="text-center">
                                <p className="font-display text-2xl font-bold text-white">
                                    {value}
                                </p>
                                <p className="mt-0.5 font-mono text-xs tracking-wider text-white/30 uppercase">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="font-mono text-xs text-white/30">
                        Joined {formatDate(user.createdAt)}
                    </div>
                </div>

                {/* Posts */}
                <div>
                    <h3 className="font-display mb-4 font-semibold text-white/80">
                        Recent Posts
                    </h3>
                    {posts.length === 0 ? (
                        <EmptyState
                            icon={<FileText className="h-8 w-8" />}
                            title="No posts yet"
                        />
                    ) : (
                        <div className="space-y-3">
                            {posts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/posts/${post.id}`}
                                    className="glass glass-hover group block space-y-2 rounded-xl p-5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="group-hover:text-accent-400 text-sm font-medium text-white/90 transition-colors">
                                            {post.title}
                                        </p>
                                        <span className="flex shrink-0 items-center gap-1 text-xs text-white/30">
                                            <Heart className="h-3 w-3" />{' '}
                                            {post.likesCount}
                                        </span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-white/35">
                                        {truncate(post.content, 120)}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {post.tags.slice(0, 4).map((t) => (
                                            <Badge key={t} variant="accent">
                                                #{t}
                                            </Badge>
                                        ))}
                                        <span className="ml-auto font-mono text-xs text-white/25">
                                            {timeAgo(post.createdAt)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
