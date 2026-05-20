export type * from './auth';
export type * from './navigation';
export type * from './ui';


// ── Pagination ────────────────────────────────────────────────────────────────

export interface PageMeta {
    limit: number;
    hasMore: boolean;
    page?: number;
    total?: number;
    totalPages?: number;
    nextCursor?: string | null;
    prevCursor?: string | null;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface XUser {
    id: string;
    name?: string;
    email?: string;
    createdAt?: string;
    followerCount?: number;
    followingCount?: number;
    isFollowedByMe?: boolean;
}

// ── Post ──────────────────────────────────────────────────────────────────────

export interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    tags: string[];
    likesCount: number;
    createdAt?: string;
    updatedAt?: string;
}

// ── Comment ───────────────────────────────────────────────────────────────────

export interface Comment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    parentId?: string | null;
    createdAt?: string;
}

// ── Moderation ────────────────────────────────────────────────────────────────

export type ModerationVerdict = 'safe' | 'review' | 'remove';

export interface ModerationResult {
    id: string;
    verdict: ModerationVerdict;
    confidence: number;
    categories: string[];
    explanation: string;
    flaggedPhrases: string[];
    error?: boolean;
}

// ── Inertia shared data ───────────────────────────────────────────────────────

export interface SharedData {
    flash: {
        success?: string;
        error?: string;
    };
    app: {
        name: string;
    };
}

export interface PageProps extends SharedData {
    [key: string]: unknown;
}
