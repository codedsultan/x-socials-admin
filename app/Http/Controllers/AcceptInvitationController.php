<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\AcceptInvitationRequest;
use App\Models\Invitation;
use App\Services\InvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AcceptInvitationController extends Controller
{
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();

        if (! $invitation->isValid()) {
            return redirect()->route('login')
                ->with('error', 'This invitation link is invalid or has already been used.');
        }

        return Inertia::render('auth/accept-invitation', [
            'email' => $invitation->email,
            'name' => $invitation->name,
            'token' => $token,
        ]);
    }

    public function store(string $token, AcceptInvitationRequest $request, InvitationService $service): RedirectResponse
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();

        if (! $invitation->isValid()) {
            return redirect()->route('login')
                ->with('error', 'This invitation link is invalid or has already been used.');
        }

        $user = $service->acceptInvitation(
            invitation: $invitation,
            name: $request->validated('name'),
            password: $request->validated('password'),
        );

        Auth::login($user);

        return redirect()->route('dashboard');
    }
}
