<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Services\XSocialsApiService;

class UsersController extends Controller
{
    public function __construct(private readonly XSocialsApiService $api) {}

    public function index(Request $request): Response
    {
        $page  = (int) $request->query('page', 1);
        $limit = 20;

        $data = $this->api->getUsers($page, $limit);

        return Inertia::render('Users/Index', [
            'users' => $data['items']  ?? [],
            'meta'  => $data['meta']   ?? [],
            'page'  => $page,
        ]);
    }

    public function show(string $id): Response
    {
        $user  = $this->api->getUser($id);
        $posts = $this->api->getPosts(1, 10, null, $id);

        return Inertia::render('Users/Show', [
            'user'  => $user,
            'posts' => $posts['items'] ?? [],
            'meta'  => $posts['meta']  ?? [],
        ]);
    }
}
