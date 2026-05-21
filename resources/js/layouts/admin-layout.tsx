import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Users, FileText, ShieldAlert,
    Zap, ChevronRight, Bell, ClipboardList, ScrollText,
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

interface Props { children: React.ReactNode; title?: string }

export default function AdminLayout({ children, title }: Props) {
    const { url, props } = usePage<PageProps>();
    const { flash } = props;

    return (
        <div className="flex min-h-screen bg-surface-900">
            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <aside className="fixed inset-y-0 left-0 w-60 flex flex-col border-r border-white/8 bg-surface-950/80 backdrop-blur-xl z-20">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/8">
                    <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-accent-500/20 border border-accent-500/30">
                        <Zap className="h-4 w-4 text-accent-400 fill-accent-400" />
                    </span>
                    <div>
                        <p className="font-display font-bold text-sm text-white leading-none">X-socials</p>
                        <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">Admin</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {nav.map(({ href, icon: Icon, label }) => {
                        const active = href === '/' ? url === '/' : url.startsWith(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                    active
                                        ? 'bg-accent-500/15 text-accent-400 border border-accent-500/20'
                                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                )}
                            >
                                <Icon className={cn('h-4 w-4 shrink-0', active && 'stroke-[2.5px]')} />
                                <span className="flex-1">{label}</span>
                                {active && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-3 pb-4 border-t border-white/8 pt-4">
                    <div className="flex items-center gap-2.5 px-3 py-2">
                        <div className="h-7 w-7 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-accent-400">A</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-white/80 truncate">Admin</p>
                            <p className="text-[10px] text-white/30 truncate">x-socials</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main ─────────────────────────────────────────────────────── */}
            <div className="flex-1 ml-60 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-8 border-b border-white/8 bg-surface-900/80 backdrop-blur-sm">
                    <h1 className="font-display font-semibold text-lg text-white/90">
                        {title ?? 'Dashboard'}
                    </h1>
                    <button className="relative p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
                        <Bell className="h-4.5 w-4.5" />
                    </button>
                </header>

                {/* Flash messages */}
                {(flash.success || flash.error) && (
                    <div className={cn(
                        'mx-8 mt-4 px-4 py-3 rounded-xl text-sm border',
                        flash.success ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'
                    )}>
                        {flash.success ?? flash.error}
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1 px-8 py-8 animate-slide-up">
                    {children}
                </main>
            </div>
        </div>
    );
}
