import { usePage } from '@inertiajs/react';
import {
    Bell,
    ClipboardList,
    FileText,
    LayoutDashboard,
    MailOpen,
    ScanLine,
    ScrollText,
    ShieldAlert,
    UserCog,
    Users,
} from 'lucide-react';
import { AppContent } from '@/components/app-content';
import AppLogo from '@/components/app-logo';
import { AppShell } from '@/components/app-shell';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import adminInvitations from '@/routes/admin/invitations';
import adminTeam from '@/routes/admin/team';
import audit from '@/routes/audit';
import moderation from '@/routes/moderation';
import posts from '@/routes/posts';
import queue from '@/routes/queue';
import scans from '@/routes/scans';
import users from '@/routes/users';
import type { NavItem, PageProps } from '@/types';

const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutDashboard },
    { title: 'Users', href: users.index(), icon: Users },
    { title: 'Posts', href: posts.index(), icon: FileText },
    { title: 'Review Queue', href: queue.index(), icon: ClipboardList },
    { title: 'On-demand', href: moderation.index(), icon: ShieldAlert },
    { title: 'Scan Runs', href: scans.index(), icon: ScanLine },
    { title: 'Audit Log', href: audit.index(), icon: ScrollText },
    { title: 'Invitations', href: adminInvitations.index(), icon: MailOpen },
    { title: 'Admin Team', href: adminTeam.index(), icon: UserCog },
];

interface Props {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title }: Props) {
    const { props } = usePage<PageProps>();
    const { flash } = props;

    return (
        <AppShell variant="sidebar">
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <a href={dashboard().url}>
                                    <AppLogo />
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <NavMain items={adminNavItems} />
                </SidebarContent>

                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <AppContent variant="sidebar" className="overflow-x-hidden">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <h1 className="text-lg font-semibold">
                            {title ?? 'Dashboard'}
                        </h1>
                    </div>
                    <button className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                        <Bell className="h-4 w-4" />
                    </button>
                </header>

                {(flash.success || flash.error) && (
                    <div
                        className={cn(
                            'mx-6 mt-4 rounded-xl border px-4 py-3 text-sm',
                            flash.success
                                ? 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
                        )}
                    >
                        {flash.success ?? flash.error}
                    </div>
                )}

                <main className="flex-1 px-6 py-6">{children}</main>
            </AppContent>
        </AppShell>
    );
}
