import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';
import { StatCard } from '@/components/ui';
import {
    Users, FileText, ArrowRight, Activity,
    ClipboardList, AlertTriangle, Clock, CheckCircle,
} from 'lucide-react';
import { formatNumber, timeAgo, cn } from '@/lib/utils';

interface Props {
    stats: {
        totalUsers: number | string;
        totalPosts: number | string;
    };
    queueStats: {
        pendingRemove: number;
        pendingReview: number;
        resolvedToday: number;
    };
    lastScan?: {
        status: string;
        comments_scanned: number;
        flagged: number;
        queued_for_review: number;
        started_at: string;
    } | null;
    apiOk: boolean;
}

export default function Dashboard({ stats, queueStats, lastScan, apiOk }: Props) {
    const totalPending = queueStats.pendingRemove + queueStats.pendingReview;

    return (
        <AdminLayout title="Dashboard">
            <div className="space-y-8">

                <div>
                    <h2 className="font-display text-2xl font-bold text-white">Overview</h2>
                    <p className="text-sm text-white/40 mt-0.5">x-socials platform at a glance</p>
                </div>

                {/* Platform stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Users"
                        value={typeof stats.totalUsers === 'number' ? formatNumber(stats.totalUsers) : stats.totalUsers}
                        icon={<Users className="h-5 w-5" />}
                    />
                    <StatCard
                        label="Total Posts"
                        value={typeof stats.totalPosts === 'number' ? formatNumber(stats.totalPosts) : stats.totalPosts}
                        icon={<FileText className="h-5 w-5" />}
                    />
                    <StatCard
                        label="Pending Review"
                        value={totalPending}
                        icon={<ClipboardList className="h-5 w-5" />}
                        trend={totalPending > 0 ? `${queueStats.pendingRemove} to remove, ${queueStats.pendingReview} to review` : 'Queue is clear'}
                        className={totalPending > 0 ? 'border-warning/20' : ''}
                    />
                    <StatCard
                        label="Resolved Today"
                        value={queueStats.resolvedToday}
                        icon={<CheckCircle className="h-5 w-5" />}
                        trend="Queue items actioned"
                    />
                </div>

                {/* Moderation urgency alert */}
                {queueStats.pendingRemove > 0 && (
                    <Link
                        href="/queue?verdict=remove"
                        className="flex items-center gap-4 glass rounded-2xl p-5 border-danger/20 hover:border-danger/40 transition-all group"
                    >
                        <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-danger/15 border border-danger/25 shrink-0">
                            <AlertTriangle className="h-5 w-5 text-danger" />
                        </span>
                        <div className="flex-1">
                            <p className="font-medium text-sm text-white/90">
                                {queueStats.pendingRemove} comment{queueStats.pendingRemove !== 1 ? 's' : ''} flagged for removal
                            </p>
                            <p className="text-xs text-white/35 mt-0.5">
                                AI confidence is high — these should be reviewed promptly
                            </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-danger/50 group-hover:text-danger group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                )}

                {/* Last scan status */}
                {lastScan ? (
                    <div className="glass rounded-2xl p-5 flex items-center gap-4">
                        <span className={cn(
                            'flex items-center justify-center h-10 w-10 rounded-xl border shrink-0',
                            lastScan.status === 'completed'
                                ? 'bg-success/10 border-success/20'
                                : 'bg-danger/10 border-danger/20'
                        )}>
                            <Clock className={cn('h-5 w-5', lastScan.status === 'completed' ? 'text-success' : 'text-danger')} />
                        </span>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/80">
                                Last scan {timeAgo(lastScan.started_at)}
                            </p>
                            <p className="text-xs text-white/30 mt-0.5">
                                {lastScan.comments_scanned} comments scanned ·{' '}
                                {lastScan.flagged} flagged for removal ·{' '}
                                {lastScan.queued_for_review} queued for review
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono shrink-0">
                            <span className={cn(
                                'h-2 w-2 rounded-full',
                                lastScan.status === 'completed' ? 'bg-success animate-pulse-slow' : 'bg-danger'
                            )} />
                            <span className={lastScan.status === 'completed' ? 'text-success' : 'text-danger'}>
                                {lastScan.status}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="glass rounded-2xl p-5 flex items-center gap-4">
                        <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 shrink-0">
                            <Clock className="h-5 w-5 text-white/20" />
                        </span>
                        <div>
                            <p className="text-sm text-white/50">No scans run yet</p>
                            <p className="text-xs text-white/25 mt-0.5">
                                Run <code className="font-mono text-accent-400">php artisan moderation:scan</code> or wait for the scheduler
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick actions */}
                <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/25 mb-3">Quick actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { href: '/queue', icon: ClipboardList, label: 'Review Queue', desc: 'Act on AI-flagged comments', badge: totalPending },
                            { href: '/users', icon: Users, label: 'Manage Users', desc: 'Roles, suspensions, profiles', badge: null },
                            { href: '/posts', icon: FileText, label: 'Review Posts', desc: 'Browse and remove content', badge: null },
                        ].map(({ href, icon: Icon, label, desc, badge }) => (
                            <Link
                                key={href}
                                href={href}
                                className="group glass glass-hover rounded-2xl p-5 flex items-start gap-4 hover:border-accent-500/30 transition-all"
                            >
                                <span className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-accent-500/10 border border-accent-500/20 shrink-0 group-hover:bg-accent-500/20 transition-colors">
                                    <Icon className="h-4 w-4 text-accent-400" />
                                    {badge != null && badge > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-warning text-[9px] font-bold text-black">
                                            {badge}
                                        </span>
                                    )}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-white/90">{label}</p>
                                    <p className="text-xs text-white/35 mt-0.5">{desc}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-accent-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* API status */}
                <div className={cn('glass rounded-2xl p-5 flex items-center gap-4', !apiOk && 'border-danger/20')}>
                    <span className={cn(
                        'flex items-center justify-center h-10 w-10 rounded-xl border shrink-0',
                        apiOk ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20'
                    )}>
                        <Activity className={cn('h-5 w-5', apiOk ? 'text-success' : 'text-danger')} />
                    </span>
                    <div>
                        <p className="text-sm font-medium text-white/80">
                            {apiOk ? 'x-socials API connected' : 'x-socials API unreachable'}
                        </p>
                        <p className="text-xs text-white/30">
                            {apiOk ? 'Node.js API is healthy' : 'Check XSOCIALS_API_URL and XSOCIALS_ADMIN_TOKEN in .env'}
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full', apiOk ? 'bg-success animate-pulse-slow' : 'bg-danger')} />
                        <span className={cn('text-xs font-mono', apiOk ? 'text-success' : 'text-danger')}>
                            {apiOk ? 'online' : 'offline'}
                        </span>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
