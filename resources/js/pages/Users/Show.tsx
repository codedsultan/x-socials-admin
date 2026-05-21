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
            <div className="space-y-8 max-w-3xl">

                <Link href="/users" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
                </Link>

                {/* Profile card */}
                <div className="glass rounded-2xl p-8 space-y-6">
                    <div className="flex items-start gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center shrink-0">
                            <span className="font-display text-2xl font-bold text-accent-400">
                                {(user.name ?? user.email ?? '?')[0]?.toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-display text-xl font-bold text-white">{user.name ?? '—'}</h2>
                            <p className="text-sm text-white/40 mt-0.5">{user.email ?? '—'}</p>
                            <p className="text-xs text-white/25 font-mono mt-1">{user.id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/8">
                        {[
                            { icon: Users, label: 'Followers', value: formatNumber(user.followerCount) },
                            { icon: Users, label: 'Following', value: formatNumber(user.followingCount) },
                            { icon: FileText, label: 'Posts', value: formatNumber(meta.total) },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="text-center">
                                <p className="font-display text-2xl font-bold text-white">{value}</p>
                                <p className="text-xs text-white/30 font-mono uppercase tracking-wider mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-xs text-white/30 font-mono">
                        Joined {formatDate(user.createdAt)}
                    </div>
                </div>

                {/* Posts */}
                <div>
                    <h3 className="font-display font-semibold text-white/80 mb-4">Recent Posts</h3>
                    {posts.length === 0 ? (
                        <EmptyState icon={<FileText className="h-8 w-8" />} title="No posts yet" />
                    ) : (
                        <div className="space-y-3">
                            {posts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/posts/${post.id}`}
                                    className="block glass glass-hover rounded-xl p-5 space-y-2 group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="font-medium text-sm text-white/90 group-hover:text-accent-400 transition-colors">
                                            {post.title}
                                        </p>
                                        <span className="flex items-center gap-1 text-xs text-white/30 shrink-0">
                                            <Heart className="h-3 w-3" /> {post.likesCount}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/35 leading-relaxed">
                                        {truncate(post.content, 120)}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {post.tags.slice(0, 4).map(t => (
                                            <Badge key={t} variant="accent">#{t}</Badge>
                                        ))}
                                        <span className="ml-auto text-xs text-white/25 font-mono">
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
