<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * AdminUserSeeder
 *
 * Creates the initial admin user for the panel.
 * Run after migrations: php artisan db:seed
 *
 * The password is intentionally obvious here — change it immediately
 * after first login in any non-local environment.
 *
 * For production: create accounts via
 *   php artisan admin:create-user
 * (see the CreateAdminUser artisan command)
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@x-socials.local'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin1234'),   // CHANGE THIS
                'active' => true,
            ]
        );

        $this->command->info('Admin user ready: admin@x-socials.local / admin1234');
        $this->command->warn('Change the password immediately after first login!');
    }
}
