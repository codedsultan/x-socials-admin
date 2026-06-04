<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\AutoRemoveCommand;
use App\Console\Commands\ModerationScanCommand;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


Schedule::command(AutoRemoveCommand::class)
    ->everyFiveMinutes()
    // ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/auto-remove.log'));

// Schedule::command(ModerationScanCommand::class, ['--mode' => 'reconciliation'])
//     ->dailyAt('03:00')
//     ->timezone('UTC')
//     ->withoutOverlapping()
//     ->runInBackground()
//     ->appendOutputTo(storage_path('logs/reconciliation-scan.log'));

Schedule::command(ModerationScanCommand::class, ['--mode' => 'reconciliation'])
    // ->everySixHours()
    ->everyMinute()
    ->cron('0 */4 * * *')
    ->timezone('UTC')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/reconciliation-scan.log'));
