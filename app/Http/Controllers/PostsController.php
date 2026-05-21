<?php

namespace App\Http\Controllers;

use App\Models\AdminActionLog;
use App\Models\User;
use App\Services\XSocialsApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PostsController extends Controller
{
    public function __construct(private readonly XSocialsApiService $api) {}

    public function index(Request $request): Response
    {
        $page = (int) $request->query('page', 1);
        $tag = $request->query('tag');
        $authorId = $request->query('authorId');

        $data = $this->api->getPosts($page, 20, $tag, $authorId);

        return Inertia::render('Posts/Index', [
            'posts' => $data['items'] ?? [],
            'meta' => $data['meta'] ?? [],
            'page' => $page,
            'filters' => ['tag' => $tag, 'authorId' => $authorId],
        ]);
    }

    public function show(string $id): Response
    {
        $post = $this->api->getPost($id);
        $comments = $this->api->getComments($id);

        return Inertia::render('Posts/Show', [
            'post' => $post,
            'comments' => $comments['items'] ?? [],
            'meta' => $comments['meta'] ?? [],
        ]);
    }

    public function destroy(string $id): RedirectResponse
    {
        $deleted = $this->api->deletePost($id);

        if ($deleted) {
            /** @var User $admin */
            $admin = Auth::user();
            AdminActionLog::record(
                actor: $admin,
                action: 'delete_post',
                targetType: 'post',
                targetId: $id,
                ip: request()->ip(),
            );
        }

        return $deleted
            ? redirect()->route('posts.index')->with('success', 'Post deleted.')
            : back()->with('error', 'Could not delete post.');
    }
}
