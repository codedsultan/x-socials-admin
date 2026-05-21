import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            app: {
                name: string;
            };
            auth: Auth;
            sidebarOpen: boolean;
            flash: {
                success?: string;
                error?: string;
            };
            [key: string]: unknown;
        };
    }
}
