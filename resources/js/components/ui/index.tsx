import { cn, verdictConfig } from '@/lib/utils';
import type { ModerationVerdict } from '@/types';

// ── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
    return (
        <div className={cn('glass rounded-2xl p-6 space-y-4', className)}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-mono uppercase tracking-widest text-white/40">{label}</p>
                <span className="text-white/20">{icon}</span>
            </div>
            <div>
                <p className="font-display text-4xl font-bold text-white">{value}</p>
                {trend && <p className="text-xs text-white/30 mt-1">{trend}</p>}
            </div>
        </div>
    );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
    className?: string;
}

const badgeStyles = {
    default: 'bg-white/8 text-white/60 border-white/10',
    accent: 'bg-accent-500/15 text-accent-400 border-accent-500/25',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
    return (
        <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
            badgeStyles[variant],
            className
        )}>
            {children}
        </span>
    );
}

// ── VerdictBadge ──────────────────────────────────────────────────────────────

export function VerdictBadge({ verdict }: { verdict: ModerationVerdict }) {
    const config = verdictConfig[verdict];
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
            config.className
        )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
            {config.label}
        </span>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn('animate-skeleton rounded-xl bg-white/5', className)} />
    );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="space-y-px">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="grid gap-4 px-6 py-4 border-b border-white/5"
                    style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <Skeleton key={j} className="h-4" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    message?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            {icon && <div className="text-white/15 mb-2">{icon}</div>}
            <div>
                <p className="font-medium text-white/70">{title}</p>
                {message && <p className="text-sm text-white/30 mt-1">{message}</p>}
            </div>
            {action}
        </div>
    );
}

// ── ConfidenceBar ─────────────────────────────────────────────────────────────

export function ConfidenceBar({ value, verdict }: { value: number; verdict: ModerationVerdict }) {
    const pct = Math.round(value * 100);

    const gradients = {
        safe:   'linear-gradient(to right, color-mix(in oklch, var(--color-success) 50%, transparent), var(--color-success))',
        review: 'linear-gradient(to right, color-mix(in oklch, var(--color-warning) 50%, transparent), var(--color-warning))',
        remove: 'linear-gradient(to right, color-mix(in oklch, var(--color-danger)  50%, transparent), var(--color-danger))',
    };

    const pctColors = { safe: 'text-success', review: 'text-warning', remove: 'text-danger' };

    return (
        <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: gradients[verdict] }}
                />
            </div>
            <span className={cn('w-9 text-right font-mono text-xs', pctColors[verdict])}>
                {pct}%
            </span>
        </div>
    );
}
