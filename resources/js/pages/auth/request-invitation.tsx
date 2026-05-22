import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { login } from '@/routes';
import invitationRequest from '@/routes/invitation-request';

export default function RequestInvitation() {
    return (
        <>
            <Head title="Request an invitation" />

            <Form
                action={invitationRequest.store().url}
                method="post"
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
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
                                    placeholder="Your name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="message">
                                    Why do you need access?{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    tabIndex={3}
                                    rows={3}
                                    placeholder="Brief description of your role or reason for access"
                                />
                                <InputError message={errors.message} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Submit request
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={5}>
                                Sign in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

RequestInvitation.layout = {
    title: 'Request access',
    description: 'Submit a request to join the admin panel',
};
