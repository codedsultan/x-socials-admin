import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import invitations from '@/routes/invitations';

type Props = {
    email: string;
    name: string | null;
    token: string;
};

export default function AcceptInvitation({ email, name, token }: Props) {
    return (
        <>
            <Head title="Accept invitation" />

            <Form
                action={invitations.store(token).url}
                method="post"
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                                id="name"
                                type="text"
                                name="name"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                defaultValue={name ?? ''}
                                placeholder="Your name"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                readOnly
                                disabled
                                className="cursor-not-allowed opacity-75"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="new-password"
                                placeholder="Choose a password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                placeholder="Confirm password"
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 w-full"
                            tabIndex={4}
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Create account
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

AcceptInvitation.layout = {
    title: 'Accept your invitation',
    description: 'Set up your admin account to get started',
};
