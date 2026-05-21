import { Link } from '@inertiajs/react';
import {
    Users,
    FileText,
    ArrowRight,
    Activity,
    ClipboardList,
    AlertTriangle,
    Clock,
    CheckCircle,
    Zap,
    Database,
    TrendingUp,
    XCircle,
    SkipForward,
    ShieldCheck,
} from 'lucide-react';
import { StatCard } from '@/components/ui';
import AdminLayout from '@/layouts/admin-layout';
import { formatNumber, timeAgo, cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ModeratorStats {
    enqueued_total: number;
    completed_total: number;
    failed_total: number;
    skipped_total: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    health_pct: number;
}

interface Props {
    stats: {
        totalUsers: number | string;
        totalPosts: number | string;
    };
    queueStats: {
        pendingRemove: number;
        pendingReview: number;
        resolvedToday: number;
        autoRemovedToday: number;
    };
    lastScan?: {
        status: string;
        comments_scanned: number;
        flagged: number;
        queued_for_review: number;
        started_at: string;
    } | null;
    apiOk: boolean;
    moderatorOk: boolean;
    // In-memory stats from FastAPI /health (resets on restart)
    moderatorStats: Partial<ModeratorStats>;
    // Permanent 7-day split from moderation_records.trigger
    triggerBreakdown: Record<string, number>;
    autoThreshold: number;
}

// ── Webhook health badge ───────────────────────────────────────────────────────

function HealthPct({ pct }: { pct: number }) {
    const good = pct >= 95;
    const warning = pct >= 80 && pct < 95;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs',
                good
                    ? 'bg-success/10 border-success/20 text-success border'
                    : warning
                      ? 'bg-warning/10 border-warning/20 text-warning border'
                      : 'bg-danger/10 border-danger/20 text-danger border',
            )}
        >
            <span
                className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    good ? 'bg-success' : warning ? 'bg-warning' : 'bg-danger',
                )}
            />
            {pct.toFixed(1)}% success
        </span>
    );
}

// ── Trigger breakdown bar ──────────────────────────────────────────────────────
//
// Visual split of moderation_records by trigger over the last 7 days.
// Shows at a glance what fraction of analyses came from the real-time webhook
// vs the daily reconciliation scan vs manual admin actions.

function TriggerBar({ breakdown }: { breakdown: Record<string, number> }) {
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

    if (total === 0) {
        return (
            <p className="text-xs text-white/25 italic">
                No moderation records yet
            </p>
        );
    }

    const segments = [
        { key: 'realtime', label: 'Real-time', color: 'bg-accent-500' },
        { key: 'auto', label: 'Reconciliation', color: 'bg-teal-500' },
        { key: 'manual', label: 'Manual', color: 'bg-warning' },
    ].filter((s) => (breakdown[s.key] ?? 0) > 0);

    return (
        <div className="space-y-2">
            {/* Stacked bar */}
            <div className="flex h-2 gap-px overflow-hidden rounded-full">
                {segments.map((s) => (
                    <div
                        key={s.key}
                        className={cn(s.color, 'transition-all')}
                        style={{
                            width: `${((breakdown[s.key] ?? 0) / total) * 100}%`,
                        }}
                        title={`${s.label}: ${breakdown[s.key] ?? 0}`}
                    />
                ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {segments.map((s) => (
                    <span
                        key={s.key}
                        className="flex items-center gap-1.5 text-xs text-white/40"
                    >
                        <span className={cn('h-2 w-2 rounded-full', s.color)} />
                        {s.label} ({formatNumber(breakdown[s.key] ?? 0)})
                    </span>
                ))}
                <span className="ml-auto font-mono text-xs text-white/25">
                    {formatNumber(total)} total · 7d
                </span>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Dashboard({
    stats,
    queueStats,
    lastScan,
    apiOk,
    moderatorOk,
    moderatorStats,
    triggerBreakdown,
    autoThreshold,
}: Props) {
    const totalPending = queueStats.pendingRemove + queueStats.pendingReview;
    const hasStats = (moderatorStats.enqueued_total ?? 0) > 0;
    const healthPct = moderatorStats.health_pct ?? 100;
    const realtimeCount = triggerBreakdown['realtime'] ?? 0;
    const totalCount = Object.values(triggerBreakdown).reduce(
        (a, b) => a + b,
        0,
    );
    const webhookPct =
        totalCount > 0 ? Math.round((realtimeCount / totalCount) * 100) : 0;

    return (
        <AdminLayout title="Dashboard">
            <div className="space-y-8">
                <div>
                    <h2 className="font-display text-2xl font-bold text-white">
                        Overview
                    </h2>
                    <p className="mt-0.5 text-sm text-white/40">
                        x-socials platform at a glance
                    </p>
                </div>

                {/* Platform stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Users"
                        value={
                            typeof stats.totalUsers === 'number'
                                ? formatNumber(stats.totalUsers)
                                : stats.totalUsers
                        }
                        icon={<Users className="h-5 w-5" />}
                    />
                    <StatCard
                        label="Total Posts"
                        value={
                            typeof stats.totalPosts === 'number'
                                ? formatNumber(stats.totalPosts)
                                : stats.totalPosts
                        }
                        icon={<FileText className="h-5 w-5" />}
                    />
                    <StatCard
                        label="Pending Review"
                        value={totalPending}
                        icon={<ClipboardList className="h-5 w-5" />}
                        trend={
                            totalPending > 0
                                ? `${queueStats.pendingRemove} to remove · ${queueStats.pendingReview} to review`
                                : 'Queue is clear'
                        }
                        className={totalPending > 0 ? 'border-warning/20' : ''}
                    />
                    <StatCard
                        label="Resolved Today"
                        value={
                            queueStats.resolvedToday +
                            queueStats.autoRemovedToday
                        }
                        icon={<CheckCircle className="h-5 w-5" />}
                        trend={
                            queueStats.autoRemovedToday > 0
                                ? `${queueStats.autoRemovedToday} auto-removed`
                                : 'Queue items actioned'
                        }
                    />
                </div>

                {/* Removal alert */}
                {queueStats.pendingRemove > 0 && (
                    <Link
                        href="/queue?verdict=remove"
                        className="glass border-danger/20 hover:border-danger/40 group flex items-center gap-4 rounded-2xl p-5 transition-all"
                    >
                        <span className="bg-danger/15 border-danger/25 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border">
                            <AlertTriangle className="text-danger h-5 w-5" />
                        </span>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/90">
                                {queueStats.pendingRemove} item
                                {queueStats.pendingRemove !== 1 ? 's' : ''}{' '}
                                flagged for removal
                            </p>
                            <p className="mt-0.5 text-xs text-white/35">
                                AI confidence is high — review promptly or wait
                                for auto-remove (≥
                                {Math.round(autoThreshold * 100)}% threshold)
                            </p>
                        </div>
                        <ArrowRight className="text-danger/50 group-hover:text-danger h-4 w-4 shrink-0 transition-all group-hover:translate-x-0.5" />
                    </Link>
                )}

                {/* ── Real-time webhook queue stats ─────────────────────────── */}
                <div className="glass overflow-hidden rounded-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <span
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-lg border',
                                    moderatorOk
                                        ? 'bg-success/10 border-success/20'
                                        : 'bg-danger/10 border-danger/20',
                                )}
                            >
                                <Zap
                                    className={cn(
                                        'h-4 w-4',
                                        moderatorOk
                                            ? 'text-success'
                                            : 'text-danger',
                                    )}
                                />
                            </span>
                            <div>
                                <p className="text-sm font-medium text-white/90">
                                    Real-time moderation queue
                                </p>
                                <p className="text-xs text-white/30">
                                    {moderatorOk
                                        ? 'FastAPI connected'
                                        : 'FastAPI unreachable'}
                                    {hasStats && ' · stats reset on restart'}
                                </p>
                            </div>
                        </div>
                        {hasStats && <HealthPct pct={healthPct} />}
                    </div>

                    {/* In-memory stat tiles (4 across) */}
                    <div className="grid grid-cols-2 divide-x divide-y divide-white/6 sm:grid-cols-4 sm:divide-y-0">
                        {[
                            {
                                icon: <TrendingUp className="h-4 w-4" />,
                                label: 'Enqueued',
                                value: moderatorStats.enqueued_total ?? 0,
                                sub: 'since last restart',
                                color: 'text-white/70',
                            },
                            {
                                icon: <ShieldCheck className="h-4 w-4" />,
                                label: 'Completed',
                                value: moderatorStats.completed_total ?? 0,
                                sub: 'new records written',
                                color: 'text-success',
                            },
                            {
                                icon: <SkipForward className="h-4 w-4" />,
                                label: 'Skipped',
                                value: moderatorStats.skipped_total ?? 0,
                                sub: 'already analysed today',
                                color: 'text-white/40',
                            },
                            {
                                icon: <XCircle className="h-4 w-4" />,
                                label: 'Failed',
                                value: moderatorStats.failed_total ?? 0,
                                sub: 'reconciliation will cover',
                                color:
                                    (moderatorStats.failed_total ?? 0) > 0
                                        ? 'text-danger'
                                        : 'text-white/40',
                            },
                        ].map(({ icon, label, value, sub, color }) => (
                            <div key={label} className="px-5 py-4">
                                <div
                                    className={cn(
                                        'mb-1 flex items-center gap-1.5',
                                        color,
                                    )}
                                >
                                    {icon}
                                    <span className="font-mono text-xs tracking-wider uppercase">
                                        {label}
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        'font-display text-2xl font-bold',
                                        color,
                                    )}
                                >
                                    {formatNumber(value)}
                                </p>
                                <p className="mt-0.5 text-xs text-white/25">
                                    {sub}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Latency row */}
                    {hasStats && (
                        <div className="flex items-center gap-6 border-t border-white/6 bg-white/2 px-5 py-3">
                            <div className="flex items-center gap-2 text-xs text-white/40">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="font-mono tracking-wider uppercase">
                                    Avg latency
                                </span>
                                <span
                                    className={cn(
                                        'font-mono font-medium',
                                        (moderatorStats.avg_latency_ms ?? 0) <
                                            500
                                            ? 'text-success'
                                            : (moderatorStats.avg_latency_ms ??
                                                    0) < 1500
                                              ? 'text-warning'
                                              : 'text-danger',
                                    )}
                                >
                                    {moderatorStats.avg_latency_ms ?? 0}ms
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/40">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="font-mono tracking-wider uppercase">
                                    p95 latency
                                </span>
                                <span
                                    className={cn(
                                        'font-mono font-medium',
                                        (moderatorStats.p95_latency_ms ?? 0) <
                                            1000
                                            ? 'text-success'
                                            : (moderatorStats.p95_latency_ms ??
                                                    0) < 3000
                                              ? 'text-warning'
                                              : 'text-danger',
                                    )}
                                >
                                    {moderatorStats.p95_latency_ms === 0
                                        ? '< 20 samples'
                                        : `${moderatorStats.p95_latency_ms}ms`}
                                </span>
                            </div>
                            <span className="ml-auto text-xs text-white/20">
                                last 100 items
                            </span>
                        </div>
                    )}

                    {/* 7-day trigger breakdown */}
                    <div className="border-t border-white/6 px-5 py-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Database className="h-3.5 w-3.5 text-white/30" />
                            <p className="font-mono text-xs tracking-wider text-white/30 uppercase">
                                Pipeline split · 7 days
                            </p>
                            {totalCount > 0 && (
                                <span className="ml-auto text-xs text-white/25">
                                    {webhookPct}% via webhook
                                </span>
                            )}
                        </div>
                        <TriggerBar breakdown={triggerBreakdown} />
                    </div>
                </div>

                {/* Last scan status */}
                {lastScan ? (
                    <div className="glass flex items-center gap-4 rounded-2xl p-5">
                        <span
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                                lastScan.status === 'completed'
                                    ? 'bg-success/10 border-success/20'
                                    : 'bg-danger/10 border-danger/20',
                            )}
                        >
                            <Clock
                                className={cn(
                                    'h-5 w-5',
                                    lastScan.status === 'completed'
                                        ? 'text-success'
                                        : 'text-danger',
                                )}
                            />
                        </span>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/80">
                                Last reconciliation scan{' '}
                                {timeAgo(lastScan.started_at)}
                            </p>
                            <p className="mt-0.5 text-xs text-white/30">
                                {lastScan.comments_scanned} scanned ·{' '}
                                {lastScan.flagged} flagged for removal ·{' '}
                                {lastScan.queued_for_review} queued for review
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 font-mono text-xs">
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-full',
                                    lastScan.status === 'completed'
                                        ? 'bg-success animate-pulse-slow'
                                        : 'bg-danger',
                                )}
                            />
                            <span
                                className={
                                    lastScan.status === 'completed'
                                        ? 'text-success'
                                        : 'text-danger'
                                }
                            >
                                {lastScan.status}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="glass flex items-center gap-4 rounded-2xl p-5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <Clock className="h-5 w-5 text-white/20" />
                        </span>
                        <div>
                            <p className="text-sm text-white/50">
                                No reconciliation scan run yet
                            </p>
                            <p className="mt-0.5 text-xs text-white/25">
                                Runs daily at 03:00 UTC · trigger manually:{' '}
                                <code className="text-accent-400 font-mono">
                                    php artisan moderation:scan
                                    --mode=reconciliation
                                </code>
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick actions */}
                <div>
                    <h3 className="mb-3 font-mono text-xs tracking-widest text-white/25 uppercase">
                        Quick actions
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                            {
                                href: '/queue',
                                icon: ClipboardList,
                                label: 'Review Queue',
                                desc: 'Act on AI-flagged content',
                                badge: totalPending,
                            },
                            {
                                href: '/users',
                                icon: Users,
                                label: 'Manage Users',
                                desc: 'Roles, suspensions, profiles',
                                badge: null,
                            },
                            {
                                href: '/posts',
                                icon: FileText,
                                label: 'Review Posts',
                                desc: 'Browse and remove content',
                                badge: null,
                            },
                        ].map(({ href, icon: Icon, label, desc, badge }) => (
                            <Link
                                key={href}
                                href={href}
                                className="group glass glass-hover hover:border-accent-500/30 flex items-start gap-4 rounded-2xl p-5 transition-all"
                            >
                                <span className="bg-accent-500/10 border-accent-500/20 group-hover:bg-accent-500/20 relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors">
                                    <Icon className="text-accent-400 h-4 w-4" />
                                    {badge != null && badge > 0 && (
                                        <span className="bg-warning absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-black">
                                            {badge}
                                        </span>
                                    )}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-white/90">
                                        {label}
                                    </p>
                                    <p className="mt-0.5 text-xs text-white/35">
                                        {desc}
                                    </p>
                                </div>
                                <ArrowRight className="group-hover:text-accent-400 mt-0.5 h-4 w-4 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Service status */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                        {
                            ok: apiOk,
                            icon: Activity,
                            label: apiOk
                                ? 'x-socials API connected'
                                : 'x-socials API unreachable',
                            sub: apiOk
                                ? 'Node.js API is healthy'
                                : 'Check XSOCIALS_API_URL in .env',
                            badge: apiOk ? 'online' : 'offline',
                        },
                        {
                            ok: moderatorOk,
                            icon: Zap,
                            label: moderatorOk
                                ? 'AI moderator connected'
                                : 'AI moderator unreachable',
                            sub: moderatorOk
                                ? 'FastAPI is healthy'
                                : 'Check MODERATOR_URL in .env',
                            badge: moderatorOk ? 'online' : 'offline',
                        },
                    ].map(({ ok, icon: Icon, label, sub, badge }) => (
                        <div
                            key={label}
                            className={cn(
                                'glass flex items-center gap-4 rounded-2xl p-5',
                                !ok && 'border-danger/20',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                                    ok
                                        ? 'bg-success/10 border-success/20'
                                        : 'bg-danger/10 border-danger/20',
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-5 w-5',
                                        ok ? 'text-success' : 'text-danger',
                                    )}
                                />
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white/80">
                                    {label}
                                </p>
                                <p className="text-xs text-white/30">{sub}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded-full',
                                        ok
                                            ? 'bg-success animate-pulse-slow'
                                            : 'bg-danger',
                                    )}
                                />
                                <span
                                    className={cn(
                                        'font-mono text-xs',
                                        ok ? 'text-success' : 'text-danger',
                                    )}
                                >
                                    {badge}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
