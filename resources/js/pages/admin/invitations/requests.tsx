import { Link, router } from '@inertiajs/react';
import { Check, Clock, MailOpen, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import adminInvitationRequests from '@/routes/admin/invitation-requests';
import adminInvitations from '@/routes/admin/invitations';

interface InvitationRequest {
    id: number;
    name: string;
    email: string;
    message: string | null;
    status: 'pending' | 'approved' | 'rejected';
    reviewer: { id: number; name: string } | null;
    reviewed_at: string | null;
    created_at: string;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    requests: Paginated<InvitationRequest>;
}

function StatusBadge({ status }: { status: InvitationRequest['status'] }) {
    if (status === 'approved') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-500">
                <Check className="h-3 w-3" /> Approved
            </span>
        );
    }

    if (status === 'rejected') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-400">
                <X className="h-3 w-3" /> Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-400">
            <Clock className="h-3 w-3" /> Pending
        </span>
    );
}

export default function InvitationRequestsIndex({ requests }: Props) {
    function approve(id: number) {
        router.post(
            adminInvitationRequests.approve(id),
            {},
            { preserveScroll: true },
        );
    }

    function reject(id: number) {
        router.post(
            adminInvitationRequests.reject(id),
            {},
            { preserveScroll: true },
        );
    }

    const pendingCount = requests.data.filter(
        (r) => r.status === 'pending',
    ).length;

    return (
        <AdminLayout title="Invitation Requests">
            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Access requests
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {requests.total} total · {pendingCount} pending
                            review
                        </p>
                    </div>
                    <Link
                        href={adminInvitations.index()}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
                    >
                        <Send className="h-4 w-4" />
                        Sent invitations
                    </Link>
                </div>

                {requests.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                        No invitation requests yet.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/30">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Requester
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Message
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Submitted
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {requests.data.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="transition-colors hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {req.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {req.email}
                                            </div>
                                        </td>
                                        <td className="max-w-[260px] px-4 py-3">
                                            {req.message ? (
                                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                                    {req.message}
                                                </p>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/40 italic">
                                                    No message
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                                            {new Date(
                                                req.created_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={req.status} />
                                            {req.reviewer && (
                                                <div className="mt-1 text-[10px] text-muted-foreground">
                                                    by {req.reviewer.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {req.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 gap-1 border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10"
                                                        onClick={() =>
                                                            approve(req.id)
                                                        }
                                                    >
                                                        <Check className="h-3 w-3" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                                                        onClick={() =>
                                                            reject(req.id)
                                                        }
                                                    >
                                                        <X className="h-3 w-3" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {req.status === 'approved' && (
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MailOpen className="h-3 w-3" />{' '}
                                                    Invite sent
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {requests.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {requests.current_page > 1 && (
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={adminInvitationRequests.index({
                                        query: {
                                            page: requests.current_page - 1,
                                        },
                                    })}
                                >
                                    Previous
                                </Link>
                            </Button>
                        )}
                        <span className="flex items-center px-3 text-sm text-muted-foreground">
                            Page {requests.current_page} of {requests.last_page}
                        </span>
                        {requests.current_page < requests.last_page && (
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={adminInvitationRequests.index({
                                        query: {
                                            page: requests.current_page + 1,
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
