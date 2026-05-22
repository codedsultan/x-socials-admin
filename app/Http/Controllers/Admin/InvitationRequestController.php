<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InvitationRequest;
use App\Services\InvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvitationRequestController extends Controller
{
    public function index(): Response
    {
        $requests = InvitationRequest::with('reviewer')
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/invitations/requests', [
            'requests' => $requests,
        ]);
    }

    public function approve(Request $request, InvitationRequest $invitationRequest, InvitationService $service): RedirectResponse
    {
        if (! $invitationRequest->isPending()) {
            return back()->with('error', 'This request has already been reviewed.');
        }

        $service->approveRequest($invitationRequest, $request->user());

        return back()->with('success', 'Invitation approved and sent to '.$invitationRequest->email.'.');
    }

    public function reject(Request $request, InvitationRequest $invitationRequest, InvitationService $service): RedirectResponse
    {
        if (! $invitationRequest->isPending()) {
            return back()->with('error', 'This request has already been reviewed.');
        }

        $service->rejectRequest($invitationRequest, $request->user());

        return back()->with('success', 'Invitation request rejected.');
    }
}
