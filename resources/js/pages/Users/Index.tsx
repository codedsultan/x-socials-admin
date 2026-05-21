import { Link } from '@inertiajs/react';
import { Users, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Badge, EmptyState, TableSkeleton } from '@/components/ui';
import AdminLayout from '@/layouts/admin-layout';
import { timeAgo, formatNumber, cn } from '@/lib/utils';
import type { XUser as User, PageMeta } from '@/types';

interface Props {
    users: User[];
    meta: PageMeta;
    page: number;
}

export default function UsersIndex({ users, meta, page }: Props) {
    return (
        <AdminLayout title="Users">
            <div className="space-y-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-white">Users</h2>
                        <p className="text-sm text-white/40 mt-0.5">
                            {meta.total != null ? `${formatNumber(meta.total)} accounts` : 'All registered accounts'}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr_auto_auto] text-xs font-mono uppercase tracking-widest text-white/30 px-6 py-3 border-b border-white/8">
                        <span>User</span>
                        <span>Email</span>
                        <span>Joined</span>
                        <span />
                    </div>

                    {users.length === 0 ? (
                        <EmptyState icon={<Users className="h-10 w-10" />} title="No users found" />
                    ) : (
                        <div className="divide-y divide-white/5">
                            {users.map((user) => (
                                <div key={user.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-accent-400">
                                                {(user.name ?? user.email ?? '?')[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white/90 truncate">
                                                {user.name ?? '—'}
                                            </p>
                                            <p className="text-xs text-white/30 font-mono truncate">{user.id.slice(0, 16)}…</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-white/50 truncate">{user.email ?? '—'}</p>

                                    <p className="text-xs text-white/30 font-mono whitespace-nowrap">
                                        {timeAgo(user.createdAt)}
                                    </p>

                                    <Link
                                        href={`/users/${user.id}`}
                                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-all"
                                    >
                                        View <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {meta.totalPages && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-white/30 font-mono">
                            Page {page} of {meta.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Link
                                href={`/users?page=${page - 1}`}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg glass transition-all',
                                    page <= 1
                                        ? 'opacity-30 pointer-events-none'
                                        : 'hover:border-white/20 text-white/70'
                                )}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" /> Previous
                            </Link>
                            <Link
                                href={`/users?page=${page + 1}`}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg glass transition-all',
                                    !meta.hasMore
                                        ? 'opacity-30 pointer-events-none'
                                        : 'hover:border-white/20 text-white/70'
                                )}
                            >
                                Next <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
