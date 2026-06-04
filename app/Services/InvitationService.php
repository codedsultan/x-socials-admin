<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\InvitationRequestStatus;
use App\Models\Invitation;
use App\Models\InvitationRequest;
use App\Models\User;
use App\Notifications\InvitationNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class InvitationService
{
    public function createRequest(string $name, string $email, ?string $message): InvitationRequest
    {
        return InvitationRequest::create([
            'name' => $name,
            'email' => $email,
            'message' => $message,
            'status' => InvitationRequestStatus::Pending->value,
        ]);
    }

    public function approveRequest(InvitationRequest $invitationRequest, User $admin): Invitation
    {
        $invitationRequest->update([
            'status' => InvitationRequestStatus::Approved->value,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        return $this->sendInvitation(
            email: $invitationRequest->email,
            name: $invitationRequest->name,
            admin: $admin,
            invitationRequestId: $invitationRequest->id,
        );
    }

    public function rejectRequest(InvitationRequest $invitationRequest, User $admin): void
    {
        $invitationRequest->update([
            'status' => InvitationRequestStatus::Rejected->value,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);
    }

    public function invite(string $email, ?string $name, User $admin): Invitation
    {
        return $this->sendInvitation(email: $email, name: $name, admin: $admin);
    }

    public function acceptInvitation(Invitation $invitation, string $name, string $password): User
    {
        $user = User::create([
            'name' => $name,
            'email' => $invitation->email,
            'password' => Hash::make($password),
            'active' => true,
        ]);

        $invitation->update(['accepted_at' => now()]);

        return $user;
    }

    private function sendInvitation(string $email, ?string $name, User $admin, ?int $invitationRequestId = null): Invitation
    {
        $invitation = Invitation::create([
            'email' => $email,
            'name' => $name,
            'token' => Str::random(64),
            'invited_by' => $admin->id,
            'invitation_request_id' => $invitationRequestId,
            'expires_at' => now()->addDays(7),
        ]);

        Notification::route('mail', $email)->notify(new InvitationNotification($invitation));

        return $invitation;
    }
}
