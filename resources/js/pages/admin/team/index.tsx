import { router, usePage } from '@inertiajs/react';
import {
    MoreHorizontal,
    Pencil,
    ShieldAlert,
    Trash2,
    UserCog,
    UserMinus,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import adminTeam from '@/routes/admin/team';
import type { PageProps } from '@/types';

interface AdminMember {
    id: number;
    name: string;
    email: string;
    active: boolean;
    last_login_at: string | null;
    created_at: string;
    roles: string[];
}

interface Props {
    members: AdminMember[];
    available_roles: string[];
}

const roleStyles: Record<string, string> = {
    'super-admin': 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    admin: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    moderator: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    viewer: 'bg-white/8 text-white/50 border-white/10',
};

function RoleBadge({ role }: { role: string }) {
    const style = roleStyles[role] ?? roleStyles.viewer;

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
        >
            {role}
        </span>
    );
}

function Avatar({ name }: { name: string }) {
    return (
        <div className="bg-accent-500/20 border-accent-500/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
            <span className="text-accent-400 text-xs font-bold">
                {name[0]?.toUpperCase()}
            </span>
        </div>
    );
}

function formatDate(iso: string | null) {
    if (!iso) {
return '—';
}

    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

type ModalState =
    | { type: 'edit-role'; member: AdminMember }
    | { type: 'delete'; member: AdminMember }
    | null;

export default function TeamIndex({ members, available_roles }: Props) {
    const { props } = usePage<PageProps>();
    const currentUserId = props.auth.user?.id;

    const [modal, setModal] = useState<ModalState>(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [processing, setProcessing] = useState(false);

    function openEditRole(member: AdminMember) {
        setSelectedRole(member.roles[0] ?? '');
        setModal({ type: 'edit-role', member });
    }

    function closeModal() {
        if (!processing) {
setModal(null);
}
    }

    function saveRole() {
        if (modal?.type !== 'edit-role' || !selectedRole) {
return;
}

        setProcessing(true);
        router.patch(
            adminTeam.update(modal.member.id).url,
            { role: selectedRole },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setModal(null);
                },
            },
        );
    }

    function toggleSuspend(member: AdminMember) {
        router.patch(
            adminTeam.update(member.id).url,
            { active: !member.active },
            { preserveScroll: true },
        );
    }

    function confirmDelete() {
        if (modal?.type !== 'delete') {
return;
}

        setProcessing(true);
        router.delete(adminTeam.destroy(modal.member.id).url, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setModal(null);
            },
        });
    }

    return (
        <AdminLayout title="Admin Team">
            <div className="space-y-6">
                <div>
                    <h2 className="font-display text-2xl font-bold text-white">
                        Admin Team
                    </h2>
                    <p className="mt-0.5 text-sm text-white/40">
                        {members.length} admin account
                        {members.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="glass overflow-hidden rounded-2xl">
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-white/8 px-6 py-3 font-mono text-xs tracking-widest text-white/30 uppercase">
                        <span>Member</span>
                        <span>Role</span>
                        <span>Status</span>
                        <span>Last Login</span>
                        <span />
                    </div>

                    {members.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <UserCog className="mb-4 h-10 w-10 text-white/15" />
                            <p className="font-medium text-white/70">
                                No team members yet
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {members.map((member) => {
                                const isSelf = member.id === currentUserId;

                                return (
                                    <div
                                        key={member.id}
                                        className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-4"
                                    >
                                        {/* Identity */}
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Avatar name={member.name} />
                                            <div className="min-w-0">
                                                <p className="flex items-center gap-2 truncate text-sm font-medium text-white/90">
                                                    {member.name}
                                                    {isSelf && (
                                                        <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[10px] text-white/40">
                                                            you
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="truncate font-mono text-xs text-white/30">
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div className="flex gap-1">
                                            {member.roles.length > 0 ? (
                                                member.roles.map((r) => (
                                                    <RoleBadge
                                                        key={r}
                                                        role={r}
                                                    />
                                                ))
                                            ) : (
                                                <span className="text-xs text-white/30">
                                                    No role
                                                </span>
                                            )}
                                        </div>

                                        {/* Active status */}
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                                member.active
                                                    ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-400'
                                                    : 'border-red-500/20 bg-red-500/10 text-red-400'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${member.active ? 'bg-emerald-400' : 'bg-red-400'}`}
                                            />
                                            {member.active
                                                ? 'Active'
                                                : 'Suspended'}
                                        </span>

                                        {/* Last login */}
                                        <p className="font-mono text-xs whitespace-nowrap text-white/30">
                                            {formatDate(member.last_login_at)}
                                        </p>

                                        {/* Actions dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    disabled={isSelf}
                                                    title={
                                                        isSelf
                                                            ? 'Cannot modify your own account here'
                                                            : 'Actions'
                                                    }
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/8 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openEditRole(member)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Edit role
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        toggleSuspend(member)
                                                    }
                                                >
                                                    {member.active ? (
                                                        <>
                                                            <UserMinus className="h-4 w-4" />
                                                            Suspend
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserCheck className="h-4 w-4" />
                                                            Reactivate
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setModal({
                                                            type: 'delete',
                                                            member,
                                                        })
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                    <p className="text-xs text-white/40">
                        To add new admin accounts, use the{' '}
                        <a
                            href="/admin/invitations"
                            className="text-white/60 underline underline-offset-2 hover:text-white/80"
                        >
                            Invitations
                        </a>{' '}
                        page. Suspending a user logs them out immediately.
                    </p>
                </div>
            </div>

            {/* Edit Role dialog */}
            <Dialog
                open={modal?.type === 'edit-role'}
                onOpenChange={(open) => !open && closeModal()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change role</DialogTitle>
                        <DialogDescription>
                            Assign a new role to{' '}
                            <span className="font-medium text-foreground">
                                {modal?.type === 'edit-role' &&
                                    modal.member.name}
                            </span>
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <Select
                        value={selectedRole}
                        onValueChange={setSelectedRole}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pick a role" />
                        </SelectTrigger>
                        <SelectContent>
                            {available_roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button
                            onClick={saveRole}
                            disabled={processing || !selectedRole}
                        >
                            {processing ? 'Saving…' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog
                open={modal?.type === 'delete'}
                onOpenChange={(open) => !open && closeModal()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete admin account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete{' '}
                            <span className="font-medium text-foreground">
                                {modal?.type === 'delete' && modal.member.name}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={processing}
                        >
                            {processing ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
