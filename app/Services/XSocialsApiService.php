<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

/**
 * XSocialsApiService
 *
 * Wraps the x-socials Node.js API for use by the Laravel admin panel.
 *
 * Two route prefixes are used:
 *   /api/*        — public endpoints (posts, comments, feed)
 *   /api/admin/*  — admin-only endpoints (require role=admin JWT)
 *
 * The XSOCIALS_ADMIN_TOKEN must be obtained by logging in as a user with
 * role='admin' via POST /api/auth/login.  The token embeds the role claim
 * and the Node.js requireAdmin middleware verifies it on every admin request.
 *
 * Token refresh: for long-running Laravel queues, refresh the token before
 * it expires by calling POST /api/auth/refresh with the stored refreshToken.
 */
class XSocialsApiService
{
    private string $baseUrl;
    private string $token;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.xsocials.api_url', 'http://localhost:4000/api'), '/');
        $this->token   = config('services.xsocials.admin_token', '');
    }

    // ── HTTP helpers ──────────────────────────────────────────────────────────

    private function http(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withToken($this->token)
                   ->timeout(15)
                   ->baseUrl($this->baseUrl);
    }

    private function data(Response $response): array
    {
        $response->throw();
        return $response->json()['data'] ?? [];
    }

    // ── Dashboard / Stats ─────────────────────────────────────────────────────

    /**
     * Fetch platform-wide stats from the dedicated admin endpoint.
     * Returns: users{total,admins,suspended}, posts{total}, comments{total}, likes{total}
     */
    public function getStats(): array
    {
        try {
            $response = $this->http()->get('/admin/stats');
            return $this->data($response)['stats'] ?? [];
        } catch (\Throwable) {
            return [];
        }
    }

    // ── Users (admin endpoints — includes email, role, suspended) ─────────────

    /**
     * Full user list for admin — offset paginated.
     * Returns items[] with email/role/suspended and meta with total.
     */
    public function getUsers(int $page = 1, int $limit = 20): array
    {
        $response = $this->http()->get('/admin/users', ['page' => $page, 'limit' => $limit]);
        return $this->data($response);
    }

    /**
     * Single user — includes email, role, suspended, follower counts.
     */
    public function getUser(string $id): array
    {
        $response = $this->http()->get("/admin/users/{$id}");
        return $this->data($response)['user'] ?? [];
    }

    /**
     * Promote or demote a user.
     *
     * @param  string  $role  'admin' | 'user'
     */
    public function setUserRole(string $userId, string $role): array
    {
        $response = $this->http()->patch("/admin/users/{$userId}/role", ['role' => $role]);
        return $this->data($response)['user'] ?? [];
    }

    /**
     * Suspend or reinstate a user.
     */
    public function setUserSuspended(string $userId, bool $suspended): array
    {
        $response = $this->http()->patch("/admin/users/{$userId}/suspend", ['suspended' => $suspended]);
        return $this->data($response)['user'] ?? [];
    }

    // ── Posts (public read, admin delete) ─────────────────────────────────────

    /**
     * List posts — public endpoint (offset + cursor pagination).
     */
    public function getPosts(int $page = 1, int $limit = 20, ?string $tag = null, ?string $authorId = null): array
    {
        $params = ['page' => $page, 'limit' => $limit];
        if ($tag)      $params['tag']      = $tag;
        if ($authorId) $params['authorId'] = $authorId;

        $response = $this->http()->get('/posts', $params);
        return $this->data($response);
    }

    /**
     * Get a single post — public endpoint.
     */
    public function getPost(string $id): array
    {
        $response = $this->http()->get("/posts/{$id}");
        return $this->data($response)['post'] ?? [];
    }

    /**
     * Admin-delete a post — bypasses authorship check.
     */
    public function deletePost(string $id): bool
    {
        $response = $this->http()->delete("/admin/posts/{$id}");
        return $response->successful();
    }

    // ── Comments (public read, admin delete) ──────────────────────────────────

    /**
     * Keyset-paginated comments for a post — public endpoint.
     */
    public function getComments(string $postId, ?string $after = null, int $limit = 20): array
    {
        $params = ['limit' => $limit];
        if ($after) $params['after'] = $after;

        $response = $this->http()->get("/posts/{$postId}/comments", $params);
        return $this->data($response);
    }

    /**
     * Admin-delete a comment — bypasses authorship check.
     */
    public function deleteComment(string $commentId): bool
    {
        $response = $this->http()->delete("/admin/comments/{$commentId}");
        return $response->successful();
    }
}
