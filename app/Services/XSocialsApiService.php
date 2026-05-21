<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * XSocialsApiService
 *
 * Wraps the x-socials Node.js API for use by the Laravel admin panel.
 *
 * Two route prefixes are used:
 *   /api/*        — public endpoints (posts, comments, feed)
 *   /api/admin/*  — admin-only endpoints (require HMAC-signed requests)
 *
 * ── Path signing ─────────────────────────────────────────────────────────────
 *
 * The Node.js requireAdminKey middleware receives req.path AFTER Express has
 * stripped the mount prefix (/api/admin).  For example, a request to
 * GET /api/admin/users arrives at the middleware as req.path = "/users".
 *
 * Therefore the canonical string must be signed with the stripped path only
 * (the segment after /api/admin), NOT the full URL path.
 *
 * Mapping:
 *   HTTP call path          Signed path   (req.path inside middleware)
 *   /admin/stats            /stats
 *   /admin/users            /users
 *   /admin/users/{id}       /users/{id}
 *   /admin/users/{id}/role  /users/{id}/role
 *   /admin/posts/{id}       /posts/{id}
 *   /admin/comments/{id}    /comments/{id}
 */
class XSocialsApiService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.xsocials.api_url', 'http://localhost:4000/api'), '/');
    }

    // ── HTTP helpers ──────────────────────────────────────────────────────────

    /**
     * Build an authenticated HTTP client.
     *
     * @param  string  $method  HTTP verb for the canonical string.
     * @param  string  $signedPath  The path as Express sees it in req.path —
     *                              i.e. the segment AFTER the /api/admin mount
     *                              prefix (e.g. "/users", "/users/42/role").
     * @param  string  $body  Raw JSON body; empty string for GET/DELETE.
     */
    private function http(string $method = 'GET', string $signedPath = '', string $body = ''): PendingRequest
    {
        $key = config('services.xsocials.admin_key', '');
        $timestamp = (string) time();
        $bodyHash = hash('sha256', $body);
        $canonical = strtoupper($method)."\n".$signedPath."\n".$timestamp."\n".$bodyHash;
        $signature = hash_hmac('sha256', $canonical, $key);

        return Http::withHeaders([
            'X-Admin-Timestamp' => $timestamp,
            'X-Admin-Signature' => $signature,
        ])
            ->timeout(15)
            ->baseUrl($this->baseUrl);
    }

    /**
     * Build a signed client for POST/PATCH/PUT requests with a JSON body.
     *
     * @param  string  $signedPath  Same semantics as http() — the stripped path.
     */
    private function httpWithBody(string $method, string $signedPath, array $data): PendingRequest
    {
        $body = json_encode($data, JSON_THROW_ON_ERROR);

        return $this->http($method, $signedPath, $body)->withBody($body, 'application/json');
    }

    private function data(Response $response): array
    {
        $response->throw();

        return $response->json()['data'] ?? [];
    }

    // ── Dashboard / Stats ─────────────────────────────────────────────────────

    public function getStats(): array
    {
        try {
            // req.path = /stats
            $response = $this->http('GET', '/stats')->get('/admin/stats');

            return $this->data($response)['stats'] ?? [];
        } catch (\Throwable) {
            return [];
        }
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    public function getUsers(int $page = 1, int $limit = 20): array
    {
        // req.path = /users
        $response = $this->http('GET', '/users')->get('/admin/users', ['page' => $page, 'limit' => $limit]);

        return $this->data($response);
    }

    public function getUser(string $id): array
    {
        // req.path = /users/{id}
        $response = $this->http('GET', "/users/{$id}")->get("/admin/users/{$id}");

        return $this->data($response)['user'] ?? [];
    }

    public function setUserSuspended(string $userId, bool $suspended): array
    {
        // req.path = /users/{id}/suspend
        $response = $this->httpWithBody('PATCH', "/users/{$userId}/suspend", ['suspended' => $suspended])
            ->patch("/admin/users/{$userId}/suspend");

        return $this->data($response)['user'] ?? [];
    }

    // ── Posts ─────────────────────────────────────────────────────────────────

    /**
     * Public endpoint — no HMAC signing required.
     */
    public function getPosts(int $page = 1, int $limit = 20, ?string $tag = null, ?string $authorId = null): array
    {
        $params = ['page' => $page, 'limit' => $limit];
        if ($tag) {
            $params['tag'] = $tag;
        }
        if ($authorId) {
            $params['authorId'] = $authorId;
        }

        $response = Http::timeout(15)->baseUrl($this->baseUrl)->get('/posts', $params);

        return $this->data($response);
    }

    /**
     * Public endpoint — no HMAC signing required.
     */
    public function getPost(string $id): array
    {
        $response = Http::timeout(15)->baseUrl($this->baseUrl)->get("/posts/{$id}");

        return $this->data($response)['post'] ?? [];
    }

    public function deletePost(string $id): bool
    {
        // req.path = /posts/{id}
        $response = $this->http('DELETE', "/posts/{$id}")->delete("/admin/posts/{$id}");

        return $response->successful();
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    /**
     * Public endpoint — no HMAC signing required.
     */
    public function getComments(string $postId, ?string $after = null, int $limit = 20): array
    {
        $params = ['limit' => $limit];
        if ($after) {
            $params['after'] = $after;
        }

        $response = Http::timeout(15)->baseUrl($this->baseUrl)->get("/posts/{$postId}/comments", $params);

        return $this->data($response);
    }

    public function deleteComment(string $commentId): bool
    {
        // req.path = /comments/{id}
        $response = $this->http('DELETE', "/comments/{$commentId}")->delete("/admin/comments/{$commentId}");

        return $response->successful();
    }
}
