import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { ModerationVerdict } from '@/types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}


export function timeAgo(date?: string | null): string {
    if (!date) {
return '—';
}

    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date?: string | null): string {
    if (!date) {
return '—';
}

    return format(new Date(date), 'MMM d, yyyy');
}

export function formatNumber(n?: number | null): string {
    if (n == null) {
return '—';
}

    if (n >= 1_000_000) {
return `${(n / 1_000_000).toFixed(1)}M`;
}

    if (n >= 1_000) {
return `${(n / 1_000).toFixed(1)}k`;
}

    return String(n);
}

export function truncate(str: string, max: number): string {
    return str.length <= max ? str : str.slice(0, max).trimEnd() + '…';
}

export const verdictConfig: Record<ModerationVerdict, {
    label: string;
    className: string;
    dot: string;
}> = {
    safe: { label: 'Safe', className: 'text-success bg-success/10 border-success/20', dot: 'bg-success' },
    review: { label: 'Review', className: 'text-warning bg-warning/10 border-warning/20', dot: 'bg-warning' },
    remove: { label: 'Remove', className: 'text-danger  bg-danger/10  border-danger/20', dot: 'bg-danger' },
};
