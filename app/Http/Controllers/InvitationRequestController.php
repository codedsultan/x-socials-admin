<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvitationRequestRequest;
use App\Models\AppSetting;
use App\Services\InvitationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InvitationRequestController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        if (! AppSetting::get('invitation_request_visible', false)) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/request-invitation');
    }

    public function store(StoreInvitationRequestRequest $request, InvitationService $service): RedirectResponse
    {
        if (! AppSetting::get('invitation_request_visible', false)) {
            abort(403);
        }

        $service->createRequest(
            name: $request->validated('name'),
            email: $request->validated('email'),
            message: $request->validated('message'),
        );

        return redirect()->route('login')
            ->with('success', 'Your invitation request has been submitted. We\'ll be in touch!');
    }
}
