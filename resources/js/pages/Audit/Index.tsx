import { Link } from '@inertiajs/react';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import AdminLayout from '@/layouts/admin-layout';
import { timeAgo, cn } from '@/lib/utils';

interface LogEntry {
    id: number;
    actor_id: string;
    actor_email: string;
    action: string;
    target_type: string;
    target_id: string;
    meta: Record<string, unknown> | null;
    ip: string | null;
    created_at: string;
}

interface Props {
    logs: LogEntry[];
    pagination: { total: number; currentPage: number; lastPage: number };
}

const actionLabel: Record<string, { label: string; className: string }> = {
    delete_post: {
        label: 'Deleted post',
        className: 'bg-danger/10 text-danger border-danger/20',
    },
    delete_comment: {
        label: 'Deleted comment',
        className: 'bg-danger/10 text-danger border-danger/20',
    },
    suspend_user: {
        label: 'Suspended user',
        className: 'bg-warning/10 text-warning border-warning/20',
    },
    reinstate_user: {
        label: 'Reinstated user',
        className: 'bg-success/10 text-success border-success/20',
    },
    resolve_queue_item: {
        label: 'Removed (queue)',
        className: 'bg-danger/10 text-danger border-danger/20',
    },
    dismiss_queue_item: {
        label: 'Kept (queue)',
        className: 'bg-success/10 text-success border-success/20',
    },
    auto_remove: {
        label: 'Auto-removed',
        className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    },
};

export default function AuditIndex({ logs, pagination }: Props) {
    return (
        <AdminLayout title="Audit Log">
            <div className="space-y-6">
                <div>
                    <h2 className="font-display text-2xl font-bold text-white">
                        Audit Log
                    </h2>
                    <p className="mt-0.5 text-sm text-white/40">
                        Immutable record of every admin action —{' '}
                        {pagination.total} total entries
                    </p>
                </div>

                <div className="glass overflow-hidden rounded-2xl">
                    <div className="grid grid-cols-[140px_1fr_168px_96px] gap-4 border-b border-white/8 px-6 py-3 font-mono text-xs tracking-widest text-white/25 uppercase">
                        <span>Action</span>
                        <span>Target</span>
                        <span>Admin</span>
                        <span>When</span>
                    </div>

                    {logs.length === 0 ? (
                        <EmptyState
                            icon={<ScrollText className="h-10 w-10" />}
                            title="No audit logs yet"
                            message="Actions will appear here as admins use the panel"
                        />
                    ) : (
                        <div className="divide-y divide-white/5">
                            {logs.map((log) => {
                                const config = actionLabel[log.action] ?? {
                                    label: log.action,
                                    className:
                                        'bg-white/8 text-white/50 border-white/10',
                                };

                                return (
                                    <div
                                        key={log.id}
                                        className="grid grid-cols-[140px_1fr_168px_96px] items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/3"
                                    >
                                        <span
                                            className={cn(
                                                'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                                config.className,
                                            )}
                                        >
                                            {config.label}
                                        </span>
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="shrink-0 font-mono text-xs text-white/25">
                                                {log.target_type}:
                                            </span>
                                            <span className="truncate font-mono text-xs text-white/60">
                                                {log.target_id.slice(0, 20)}…
                                            </span>
                                        </div>
                                        <p className="truncate font-mono text-xs text-white/35">
                                            {log.actor_email ===
                                            'system@auto-moderator' ? (
                                                <span className="text-orange-400/70">
                                                    auto-moderator
                                                </span>
                                            ) : (
                                                log.actor_email
                                            )}
                                        </p>
                                        <p className="font-mono text-xs whitespace-nowrap text-white/25">
                                            {timeAgo(log.created_at)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {pagination.lastPage > 1 && (
                    <div className="flex items-center justify-end gap-2">
                        {[
                            {
                                page: pagination.currentPage - 1,
                                label: 'Previous',
                                icon: ChevronLeft,
                                disabled: pagination.currentPage <= 1,
                            },
                            {
                                page: pagination.currentPage + 1,
                                label: 'Next',
                                icon: ChevronRight,
                                disabled:
                                    pagination.currentPage >=
                                    pagination.lastPage,
                            },
                        ].map(({ page, label, icon: Icon, disabled }) => (
                            <Link
                                key={label}
                                href={`/audit?page=${page}`}
                                className={cn(
                                    'glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all',
                                    disabled
                                        ? 'pointer-events-none opacity-30'
                                        : 'text-white/60 hover:border-white/20',
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
                )}
            </div>
        </AdminLayout>
    );
}
