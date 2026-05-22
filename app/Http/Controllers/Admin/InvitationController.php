<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInvitationRequest;
use App\Models\AppSetting;
use App\Models\Invitation;
use App\Services\InvitationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function index(): Response
    {
        $invitations = Invitation::with('inviter', 'invitationRequest')
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/invitations/index', [
            'invitations' => $invitations,
            'invitationRequestVisible' => (bool) AppSetting::get('invitation_request_visible', false),
        ]);
    }

    public function store(StoreInvitationRequest $request, InvitationService $service): RedirectResponse
    {
        $invitation = $service->invite(
            email: $request->validated('email'),
            name: $request->validated('name'),
            admin: $request->user(),
        );

        return back()->with('success', 'Invitation sent to '.$invitation->email.'.');
    }
}
