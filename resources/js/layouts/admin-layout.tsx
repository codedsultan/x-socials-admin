import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    FileText,
    ShieldAlert,
    Zap,
    ChevronRight,
    Bell,
    ClipboardList,
    ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

const nav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/users', icon: Users, label: 'Users' },
    { href: '/posts', icon: FileText, label: 'Posts' },
    { href: '/queue', icon: ClipboardList, label: 'Review Queue' },
    { href: '/moderation', icon: ShieldAlert, label: 'On-demand' },
    { href: '/audit', icon: ScrollText, label: 'Audit Log' },
];

interface Props {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title }: Props) {
    const { url, props } = usePage<PageProps>();
    const { flash } = props;

    return (
        <div className="bg-surface-900 flex min-h-screen">
            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <aside className="bg-surface-950/80 fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-white/8 backdrop-blur-xl">
                {/* Logo */}
                <div className="flex h-16 items-center gap-2.5 border-b border-white/8 px-5">
                    <span className="bg-accent-500/20 border-accent-500/30 flex h-8 w-8 items-center justify-center rounded-xl border">
                        <Zap className="text-accent-400 fill-accent-400 h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-display text-sm leading-none font-bold text-white">
                            X-socials
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] tracking-widest text-white/40 uppercase">
                            Admin
                        </p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
                    {nav.map(({ href, icon: Icon, label }) => {
                        const active =
                            href === '/' ? url === '/' : url.startsWith(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                                    active
                                        ? 'bg-accent-500/15 text-accent-400 border-accent-500/20 border'
                                        : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-4 w-4 shrink-0',
                                        active && 'stroke-[2.5px]',
                                    )}
                                />
                                <span className="flex-1">{label}</span>
                                {active && (
                                    <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-white/8 px-3 pt-4 pb-4">
                    <div className="flex items-center gap-2.5 px-3 py-2">
                        <div className="bg-accent-500/20 border-accent-500/30 flex h-7 w-7 items-center justify-center rounded-full border">
                            <span className="text-accent-400 text-xs font-bold">
                                A
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-white/80">
                                Admin
                            </p>
                            <p className="truncate text-[10px] text-white/30">
                                x-socials
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main ─────────────────────────────────────────────────────── */}
            <div className="ml-60 flex min-h-screen flex-1 flex-col">
                {/* Top bar */}
                <header className="bg-surface-900/80 sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/8 px-8 backdrop-blur-sm">
                    <h1 className="font-display text-lg font-semibold text-white/90">
                        {title ?? 'Dashboard'}
                    </h1>
                    <button className="relative rounded-xl p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70">
                        <Bell className="h-4.5 w-4.5" />
                    </button>
                </header>

                {/* Flash messages */}
                {(flash.success || flash.error) && (
                    <div
                        className={cn(
                            'mx-8 mt-4 rounded-xl border px-4 py-3 text-sm',
                            flash.success
                                ? 'bg-success/10 border-success/20 text-success'
                                : 'bg-danger/10 border-danger/20 text-danger',
                        )}
                    >
                        {flash.success ?? flash.error}
                    </div>
                )}

                {/* Page content */}
                <main className="animate-slide-up flex-1 px-8 py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
