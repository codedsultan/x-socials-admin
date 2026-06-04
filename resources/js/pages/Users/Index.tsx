import { Link } from '@inertiajs/react';
import { Users, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { EmptyState } from '@/components/ui';
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
                        <h2 className="font-display text-2xl font-bold text-white">
                            Users
                        </h2>
                        <p className="mt-0.5 text-sm text-white/40">
                            {meta.total != null
                                ? `${formatNumber(meta.total)} accounts`
                                : 'All registered accounts'}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="glass overflow-hidden rounded-2xl">
                    <div className="grid grid-cols-[1fr_1fr_104px_56px] gap-4 border-b border-white/8 px-6 py-3 font-mono text-xs tracking-widest text-white/30 uppercase">
                        <span>User</span>
                        <span>Email</span>
                        <span>Joined</span>
                        <span />
                    </div>

                    {users.length === 0 ? (
                        <EmptyState
                            icon={<Users className="h-10 w-10" />}
                            title="No users found"
                        />
                    ) : (
                        <div className="divide-y divide-white/5">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="group grid grid-cols-[1fr_1fr_104px_56px] items-center gap-4 px-6 py-4 transition-colors hover:bg-white/3"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-500/30 bg-accent-500/20">
                                            <span className="text-xs font-bold text-accent-400">
                                                {(user.name ??
                                                    user.email ??
                                                    '?')[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white/90">
                                                {user.name ?? '—'}
                                            </p>
                                            <p className="truncate font-mono text-xs text-white/30">
                                                {user.id.slice(0, 16)}…
                                            </p>
                                        </div>
                                    </div>

                                    <p className="truncate text-sm text-white/50">
                                        {user.email ?? '—'}
                                    </p>

                                    <p className="font-mono text-xs whitespace-nowrap text-white/30">
                                        {timeAgo(user.createdAt)}
                                    </p>

                                    <Link
                                        href={`/users/${user.id}`}
                                        className="hover:text-accent-300 flex items-center gap-1 text-xs text-accent-400 opacity-0 transition-all group-hover:opacity-100"
                                    >
                                        View{' '}
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
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
                            <Link
                                href={`/users?page=${page - 1}`}
                                className={cn(
                                    'glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all',
                                    page <= 1
                                        ? 'pointer-events-none opacity-30'
                                        : 'text-white/70 hover:border-white/20',
                                )}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" /> Previous
                            </Link>
                            <Link
                                href={`/users?page=${page + 1}`}
                                className={cn(
                                    'glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all',
                                    !meta.hasMore
                                        ? 'pointer-events-none opacity-30'
                                        : 'text-white/70 hover:border-white/20',
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
