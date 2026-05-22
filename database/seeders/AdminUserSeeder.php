<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates the initial admin user for the panel.
 *
 * Run after migrations: php artisan db:seed
 * Must be called AFTER RolesAndPermissionsSeeder.
 *
 * The password is intentionally obvious — change it immediately
 * after first login in any non-local environment.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@x-socials.local'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin1234'),   // CHANGE THIS
                'active' => true,
            ]
        );

        $admin->assignRole(Role::SuperAdmin->value);

        $this->command->info('Admin user ready: admin@x-socials.local / admin1234');
        $this->command->warn('Change the password immediately after first login!');
    }
}
