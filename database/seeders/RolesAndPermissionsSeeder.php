<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Permission;
use App\Enums\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission as SpatiePermission;
use Spatie\Permission\Models\Role as SpatieRole;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create all permissions
        $allPermissions = collect(Permission::cases())
            ->map(fn (Permission $p) => SpatiePermission::firstOrCreate(['name' => $p->value]));

        // super-admin gets every permission
        $superAdmin = SpatieRole::firstOrCreate(['name' => Role::SuperAdmin->value]);
        $superAdmin->syncPermissions($allPermissions);

        // admin — full access excluding nothing in this panel
        $admin = SpatieRole::firstOrCreate(['name' => Role::Admin->value]);
        $admin->syncPermissions($allPermissions);

        // moderator — content work only
        $moderator = SpatieRole::firstOrCreate(['name' => Role::Moderator->value]);
        $moderator->syncPermissions([
            Permission::ViewDashboard->value,
            Permission::ViewPosts->value,
            Permission::ViewModeration->value,
            Permission::AnalyseContent->value,
            Permission::DeleteContent->value,
            Permission::ViewQueue->value,
            Permission::ActionQueue->value,
            Permission::TriggerScan->value,
        ]);

        // viewer — read-only
        $viewer = SpatieRole::firstOrCreate(['name' => Role::Viewer->value]);
        $viewer->syncPermissions([
            Permission::ViewDashboard->value,
            Permission::ViewUsers->value,
            Permission::ViewPosts->value,
            Permission::ViewModeration->value,
            Permission::ViewQueue->value,
            Permission::ViewAuditLog->value,
        ]);

        $this->command->info('Roles and permissions seeded.');
        $this->command->table(
            ['Role', 'Permissions'],
            collect([$superAdmin, $admin, $moderator, $viewer])->map(fn (SpatieRole $r) => [
                $r->name,
                $r->permissions->pluck('name')->join(', '),
            ])
        );
    }
}
