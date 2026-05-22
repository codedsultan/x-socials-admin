import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { login } from '@/routes';
import invitationRequest from '@/routes/invitation-request';

// Registration is disabled. Access is granted via invitation only.
export default function Register() {
    return (
        <>
            <Head title="Registration closed" />

            <div className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
                <p>
                    Open registration is disabled. Access to this admin panel is
                    by invitation only.
                </p>
                <p>
                    Already invited? <TextLink href={login()}>Sign in</TextLink>
                </p>
                <p>
                    Need access?{' '}
                    <TextLink href={invitationRequest.create()}>
                        Request an invitation
                    </TextLink>
                </p>
            </div>
        </>
    );
}

Register.layout = {
    title: 'Registration closed',
    description: 'Access is by invitation only',
};
