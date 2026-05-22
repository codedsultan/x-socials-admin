<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvitationNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Invitation $invitation) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $acceptUrl = route('invitations.accept', $this->invitation->token);

        return (new MailMessage)
            ->subject('You have been invited to '.config('app.name'))
            ->greeting('Hello'.($this->invitation->name ? ', '.$this->invitation->name : '').'!')
            ->line('You have been invited to access the '.config('app.name').' admin panel.')
            ->action('Accept Invitation', $acceptUrl)
            ->line('This invitation link expires in 7 days.')
            ->line('If you did not expect this invitation, you may ignore this email.');
    }
}
