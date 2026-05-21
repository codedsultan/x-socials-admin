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
    filters: { action?: string; actorId?: string };
}

const actionLabel: Record<string, { label: string; className: string }> = {
    delete_post: { label: 'Deleted post', className: 'bg-danger/10 text-danger border-danger/20' },
    delete_comment: { label: 'Deleted comment', className: 'bg-danger/10 text-danger border-danger/20' },
    suspend_user: { label: 'Suspended user', className: 'bg-warning/10 text-warning border-warning/20' },
    reinstate_user: { label: 'Reinstated user', className: 'bg-success/10 text-success border-success/20' },
    resolve_queue_item: { label: 'Removed (queue)', className: 'bg-danger/10 text-danger border-danger/20' },
    dismiss_queue_item: { label: 'Kept (queue)', className: 'bg-success/10 text-success border-success/20' },
    auto_remove: { label: 'Auto-removed', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
};

export default function AuditIndex({ logs, pagination }: Props) {
    return (
        <AdminLayout title="Audit Log">
            <div className="space-y-6">

                <div>
                    <h2 className="font-display text-2xl font-bold text-white">Audit Log</h2>
                    <p className="text-sm text-white/40 mt-0.5">
                        Immutable record of every admin action — {pagination.total} total entries
                    </p>
                </div>

                <div className="glass rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 text-xs font-mono uppercase tracking-widest text-white/25 px-6 py-3 border-b border-white/8">
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
                            {logs.map(log => {
                                const config = actionLabel[log.action] ?? { label: log.action, className: 'bg-white/8 text-white/50 border-white/10' };

                                return (
                                    <div key={log.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors">
                                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border shrink-0', config.className)}>
                                            {config.label}
                                        </span>
                                        <div className="min-w-0 flex items-center gap-2">
                                            <span className="text-xs font-mono text-white/25 shrink-0">{log.target_type}:</span>
                                            <span className="text-xs font-mono text-white/60 truncate">{log.target_id.slice(0, 20)}…</span>
                                        </div>
                                        <p className="text-xs text-white/35 font-mono truncate">
                                            {log.actor_email === 'system@auto-moderator'
                                                ? <span className="text-orange-400/70">auto-moderator</span>
                                                : log.actor_email
                                            }
                                        </p>
                                        <p className="text-xs text-white/25 font-mono whitespace-nowrap">{timeAgo(log.created_at)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {pagination.lastPage > 1 && (
                    <div className="flex items-center justify-end gap-2">
                        {[
                            { page: pagination.currentPage - 1, label: 'Previous', icon: ChevronLeft, disabled: pagination.currentPage <= 1 },
                            { page: pagination.currentPage + 1, label: 'Next', icon: ChevronRight, disabled: pagination.currentPage >= pagination.lastPage },
                        ].map(({ page, label, icon: Icon, disabled }) => (
                            <Link
                                key={label}
                                href={`/audit?page=${page}`}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg glass transition-all',
                                    disabled ? 'opacity-30 pointer-events-none' : 'hover:border-white/20 text-white/60'
                                )}
                            >
                                {label === 'Previous' && <Icon className="h-3.5 w-3.5" />}
                                {label}
                                {label === 'Next' && <Icon className="h-3.5 w-3.5" />}
                            </Link>
                        ))}
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
