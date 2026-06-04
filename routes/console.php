<?php

use App\Console\Commands\AutoRemoveCommand;
use App\Console\Commands\ModerationScanCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

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
// ->everyMinute()           // Every minute
// ->everyTwoMinutes()       // Every 2 minutes
// ->everyFiveMinutes()      // Every 5 minutes
// ->everyTenMinutes()       // Every 10 minutes
// ->everyFifteenMinutes()   // Every 15 minutes
// ->everyThirtyMinutes()    // Every 30 minutes
// ->hourly()                // Every hour
// ->hourlyAt(17)            // Every hour at 17 minutes past
// ->everyTwoHours()         // Every 2 hours
// ->everyThreeHours()       // Every 3 hours
// ->everyFourHours()        // Every 4 hours
// ->everySixHours()         // Every 6 hours
// ->daily()                 // Every day at midnight
// ->dailyAt('13:00')        // Every day at 13:00
// ->twiceDaily(1, 13)       // Every day at 1:00 & 13:00
// ->weekly()                // Every week

Schedule::command(ModerationScanCommand::class, ['--mode' => 'reconciliation'])
    ->hourly()
    ->timezone('UTC')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/reconciliation-scan.log'));
