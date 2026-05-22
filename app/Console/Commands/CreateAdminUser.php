<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Create a new admin user for the panel.
 *
 * Usage:
 *   php artisan admin:create-user
 *   php artisan admin:create-user --name="Jane" --email="jane@example.com"
 */
class CreateAdminUser extends Command
{
    protected $signature = 'admin:create-user
                            {--name= : Full name of the admin user}
                            {--email= : Email address}
                            {--password= : Password (will prompt if not provided)}';

    protected $description = 'Create a new admin panel user';

    public function handle(): int
    {
        $name = $this->option('name') ?? $this->ask('Full name');
        $email = $this->option('email') ?? $this->ask('Email address');

        if (User::where('email', $email)->exists()) {
            $this->error("An admin user with email '{$email}' already exists.");

            return Command::FAILURE;
        }

        $password = $this->option('password')
            ?? $this->secret('Password (min 8 characters)');

        if (strlen($password) < 8) {
            $this->error('Password must be at least 8 characters.');

            return Command::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'active' => true,
        ]);

        $this->info("Admin user created: {$user->email} (ID: {$user->id})");

        return Command::SUCCESS;
    }
}
