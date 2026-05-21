<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Zero-downtime key rotation for the XSOCIALS_ADMIN_KEY shared secret.
 *
 * The Node.js API accepts both the current key and the next key simultaneously
 * during the transition window (via ADMIN_API_KEY_NEXT).  This lets you rotate
 * without any downtime or dropped requests.
 *
 * Full rotation procedure:
 *
 *   Step 1 — Generate new key (this command)
 *     php artisan admin:rotate-key
 *     Copy the generated key.
 *
 *   Step 2 — Add new key to Node.js as the NEXT key
 *     In x-socials .env: ADMIN_API_KEY_NEXT=<new key>
 *     Restart / redeploy Node.js
 *     Node.js now accepts BOTH old and new keys.
 *
 *   Step 3 — Switch Laravel to the new key
 *     In x-socials-admin .env: XSOCIALS_ADMIN_KEY=<new key>
 *     Restart / redeploy Laravel
 *     All new requests from Laravel now use the new key.
 *
 *   Step 4 — Retire the old key from Node.js
 *     In x-socials .env: ADMIN_API_KEY=<new key>, remove ADMIN_API_KEY_NEXT
 *     Restart / redeploy Node.js
 *     Old key is now invalid.
 *
 * Usage:
 *   php artisan admin:rotate-key
 *   php artisan admin:rotate-key --length=48
 */
class RotateAdminKey extends Command
{
    protected $signature = 'admin:rotate-key
                            {--length=32 : Key length in bytes (hex output is 2× this)}';

    protected $description = 'Generate a new XSOCIALS_ADMIN_KEY and print the rotation procedure';

    public function handle(): int
    {
        $length = max(32, (int) $this->option('length'));
        $newKey = bin2hex(random_bytes($length));
        $current = config('services.xsocials.admin_key', '');

        $this->newLine();
        $this->line('  <fg=cyan>x-socials Admin Key Rotation</>');
        $this->line('  ─────────────────────────────────────────');
        $this->newLine();
        $this->line('  <fg=yellow>New key (copy this):</>');
        $this->line("  <fg=white>{$newKey}</>");
        $this->newLine();

        if (empty($current)) {
            $this->warn('  Current XSOCIALS_ADMIN_KEY is not set. Skipping old-key display.');
        } else {
            $masked = substr($current, 0, 8).str_repeat('*', max(0, strlen($current) - 16)).substr($current, -8);
            $this->line("  Current key (masked): <fg=gray>{$masked}</>");
        }

        $this->newLine();
        $this->line('  <fg=cyan>Rotation steps (zero-downtime):</>');
        $this->newLine();
        $this->line('  <fg=green>1.</> Add new key to <fg=white>x-socials/.env</>:');
        $this->line("     <fg=gray>ADMIN_API_KEY_NEXT={$newKey}</>");
        $this->line('     Restart Node.js — it now accepts BOTH keys.');
        $this->newLine();
        $this->line('  <fg=green>2.</> Update <fg=white>x-socials-admin/.env</>:');
        $this->line("     <fg=gray>XSOCIALS_ADMIN_KEY={$newKey}</>");
        $this->line('     Restart Laravel — new key takes effect immediately.');
        $this->newLine();
        $this->line('  <fg=green>3.</> Remove transition key from <fg=white>x-socials/.env</>:');
        $this->line("     <fg=gray>ADMIN_API_KEY={$newKey}</>");
        $this->line('     <fg=gray># Remove ADMIN_API_KEY_NEXT entirely</>');
        $this->line('     Restart Node.js — old key is now invalid.');
        $this->newLine();
        $this->line('  Verify: <fg=gray>curl -X GET http://localhost:4000/api/admin/stats \\');
        $this->line("           -H 'X-Admin-Signature: ...' -H 'X-Admin-Timestamp: ...'</>");
        $this->newLine();

        return Command::SUCCESS;
    }
}
