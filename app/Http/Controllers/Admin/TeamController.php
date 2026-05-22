<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(): Response
    {
        $members = User::with('roles')
            ->latest()
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'active' => $user->active,
                'last_login_at' => $user->last_login_at?->toISOString(),
                'created_at' => $user->created_at->toISOString(),
                'roles' => $user->getRoleNames(),
            ]);

        return Inertia::render('admin/team/index', [
            'members' => $members,
            'available_roles' => collect(Role::cases())->map->value->values(),
        ]);
    }

    public function update(UpdateAdminUserRequest $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            return back()->with('error', 'You cannot modify your own account here.');
        }

        if ($request->has('role')) {
            $user->syncRoles([$request->validated('role')]);
        }

        if ($request->has('active')) {
            $user->update(['active' => $request->validated('active')]);
        }

        return back()->with('success', "{$user->name} updated.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        // Refuse if this is the last super-admin
        if ($user->hasRole(Role::SuperAdmin->value)) {
            $remainingSuperAdmins = User::role(Role::SuperAdmin->value)->where('id', '!=', $user->id)->count();
            if ($remainingSuperAdmins === 0) {
                return back()->with('error', 'Cannot delete the last super-admin account.');
            }
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "{$name} has been deleted.");
    }
}
