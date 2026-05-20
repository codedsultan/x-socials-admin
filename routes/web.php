<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\PostsController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\AuditController;

// Route::inertia('/', 'welcome')->name('home');

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::inertia('dashboard', 'dashboard')->name('dashboard');
// });

Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

Route::prefix('users')->name('users.')->group(function () {
    Route::get('/', [UsersController::class, 'index'])->name('index');
    Route::get('/{id}', [UsersController::class, 'show'])->name('show');
});

Route::prefix('posts')->name('posts.')->group(function () {
    Route::get('/', [PostsController::class, 'index'])->name('index');
    Route::get('/{id}', [PostsController::class, 'show'])->name('show');
    Route::delete('/{id}', [PostsController::class, 'destroy'])->name('destroy');
});

// On-demand moderation analysis (for drill-down into a specific post)
Route::prefix('moderation')->name('moderation.')->group(function () {
    Route::get('/', [ModerationController::class, 'index'])->name('index');
    Route::post('/analyse', [ModerationController::class, 'analyse'])->name('analyse');
    Route::delete('/comments/{commentId}', [ModerationController::class, 'destroyComment'])->name('comment.destroy');
});

// Human review queue — populated automatically by the background scanner
Route::prefix('queue')->name('queue.')->group(function () {
    Route::get('/', [QueueController::class, 'index'])->name('index');
    Route::post('/{id}/keep', [QueueController::class, 'keep'])->name('keep');
    Route::post('/{id}/remove', [QueueController::class, 'remove'])->name('remove');
});

// Admin audit log
Route::prefix('audit')->name('audit.')->group(function () {
    Route::get('/', [AuditController::class, 'index'])->name('index');
});

require __DIR__.'/settings.php';
