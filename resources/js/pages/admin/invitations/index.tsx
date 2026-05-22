import { Form, Link, router } from '@inertiajs/react';
import {
    Check,
    Clock,
    Mail,
    MailCheck,
    Send,
    ToggleLeft,
    ToggleRight,
    UserPlus,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AdminLayout from '@/layouts/admin-layout';
import adminInvitationRequests from '@/routes/admin/invitation-requests';
import adminInvitations from '@/routes/admin/invitations';
import adminSettings from '@/routes/admin/settings';

interface Invitation {
    id: number;
    email: string;
    name: string | null;
    invited_by: number;
    inviter: { id: number; name: string } | null;
    accepted_at: string | null;
    expires_at: string;
    created_at: string;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    invitations: Paginated<Invitation>;
    invitationRequestVisible: boolean;
}

function StatusBadge({ invitation }: { invitation: Invitation }) {
    const now = new Date();
    const expires = new Date(invitation.expires_at);

    if (invitation.accepted_at) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-500">
                <MailCheck className="h-3 w-3" /> Accepted
            </span>
        );
    }
    if (expires < now) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-400">
                <X className="h-3 w-3" /> Expired
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-400">
            <Clock className="h-3 w-3" /> Pending
        </span>
    );
}

export default function InvitationsIndex({
    invitations,
    invitationRequestVisible,
}: Props) {
    function toggleVisibility() {
        router.put(
            adminSettings.invitationVisibility(),
            { invitation_request_visible: !invitationRequestVisible },
            { preserveScroll: true },
        );
    }

    return (
        <AdminLayout title="Invitations">
            <div className="space-y-8">
                {/* Controls row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Sent invitations
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {invitations.total} total invitation
                            {invitations.total !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Toggle request form visibility */}
                        <button
                            onClick={toggleVisibility}
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
                            title="Toggle public request form visibility"
                        >
                            {invitationRequestVisible ? (
                                <>
                                    <ToggleRight className="h-4 w-4 text-emerald-500" />
                                    <span>
                                        Request form{' '}
                                        <span className="font-medium text-emerald-500">
                                            visible
                                        </span>
                                    </span>
                                </>
                            ) : (
                                <>
                                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                    <span>Request form hidden</span>
                                </>
                            )}
                        </button>

                        <Link
                            href={adminInvitationRequests.index()}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
                        >
                            <UserPlus className="h-4 w-4" />
                            View requests
                        </Link>
                    </div>
                </div>

                {/* Direct invite form */}
                <div className="space-y-4 rounded-xl border p-5">
                    <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">Invite someone directly</h3>
                    </div>
                    <Form
                        action={adminInvitations.store().url}
                        method="post"
                        className="flex flex-wrap gap-3"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid min-w-[180px] flex-1 gap-1">
                                    <Label htmlFor="name" className="sr-only">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Name (optional)"
                                    />
                                </div>
                                <div className="grid min-w-[220px] flex-1 gap-1">
                                    <Label htmlFor="email" className="sr-only">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="email@example.com"
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-destructive">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="shrink-0"
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <Mail className="h-4 w-4" />
                                    )}
                                    Send invite
                                </Button>
                            </>
                        )}
                    </Form>
                </div>

                {/* Invitations table */}
                {invitations.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                        No invitations sent yet.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/30">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Recipient
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Invited by
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Expires
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invitations.data.map((inv) => (
                                    <tr
                                        key={inv.id}
                                        className="transition-colors hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {inv.name ?? '—'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {inv.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {inv.inviter?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {new Date(
                                                inv.expires_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge invitation={inv} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {invitations.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {invitations.current_page > 1 && (
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={adminInvitations.index({
                                        query: {
                                            page: invitations.current_page - 1,
                                        },
                                    })}
                                >
                                    Previous
                                </Link>
                            </Button>
                        )}
                        <span className="flex items-center px-3 text-sm text-muted-foreground">
                            Page {invitations.current_page} of{' '}
                            {invitations.last_page}
                        </span>
                        {invitations.current_page < invitations.last_page && (
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={adminInvitations.index({
                                        query: {
                                            page: invitations.current_page + 1,
                                        },
                                    })}
                                >
                                    Next
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
