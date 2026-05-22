<?php

use App\Http\Controllers\AcceptInvitationController;
use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\Admin\InvitationRequestController as AdminInvitationRequestController;
use App\Http\Controllers\Admin\InvitationSettingController;
use App\Http\Controllers\Admin\TeamController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationRequestController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\PostsController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\ScanController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;

// ── Public invitation routes ──────────────────────────────────────────────────

Route::inertia('/', 'welcome')->name('home');

Route::get('/invitation-request', [InvitationRequestController::class, 'create'])->name('invitation-request.create');
Route::post('/invitation-request', [InvitationRequestController::class, 'store'])->name('invitation-request.store');
Route::get('/invitations/{token}', [AcceptInvitationController::class, 'show'])->name('invitations.accept');
Route::post('/invitations/{token}', [AcceptInvitationController::class, 'store'])->name('invitations.store');

// ── Protected — requires an active admin session ──────────────────────────────
Route::middleware('auth')->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Manual scan triggers — delegate to FastAPI
    Route::post('/scan/trigger', [ScanController::class, 'trigger'])->name('scan.trigger');
    Route::post('/scan/trigger/{postId}', [ScanController::class, 'triggerPost'])->name('scan.trigger.post');

    // Users (read from Node.js API via admin key)
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UsersController::class, 'index'])->name('index');
        Route::get('/{id}', [UsersController::class, 'show'])->name('show');
    });

    // Posts
    Route::prefix('posts')->name('posts.')->group(function () {
        Route::get('/', [PostsController::class, 'index'])->name('index');
        Route::get('/{id}', [PostsController::class, 'show'])->name('show');
        Route::delete('/{id}', [PostsController::class, 'destroy'])->name('destroy');
    });

    // On-demand AI analysis (drill-down into a specific post's comments)
    Route::prefix('moderation')->name('moderation.')->group(function () {
        Route::get('/', [ModerationController::class, 'index'])->name('index');
        Route::post('/analyse', [ModerationController::class, 'analyse'])->name('analyse');
        Route::delete('/comments/{commentId}', [ModerationController::class, 'destroyComment'])->name('comment.destroy');
        Route::delete('/posts/{postId}', [ModerationController::class, 'destroyPost'])->name('post.destroy');
    });

    // Review queue — human decisions on AI-flagged comments
    Route::prefix('queue')->name('queue.')->group(function () {
        Route::get('/', [QueueController::class, 'index'])->name('index');
        Route::post('/{id}/keep', [QueueController::class, 'keep'])->name('keep');
        Route::post('/{id}/remove', [QueueController::class, 'remove'])->name('remove');
    });

    // Audit log
    Route::prefix('audit')->name('audit.')->group(function () {
        Route::get('/', [AuditController::class, 'index'])->name('index');
    });

    // Invitation management (admin)
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::prefix('invitations')->name('invitations.')->group(function () {
            Route::get('/', [InvitationController::class, 'index'])->name('index');
            Route::post('/', [InvitationController::class, 'store'])->name('store');
        });

        Route::prefix('invitation-requests')->name('invitation-requests.')->group(function () {
            Route::get('/', [AdminInvitationRequestController::class, 'index'])->name('index');
            Route::post('/{invitationRequest}/approve', [AdminInvitationRequestController::class, 'approve'])->name('approve');
            Route::post('/{invitationRequest}/reject', [AdminInvitationRequestController::class, 'reject'])->name('reject');
        });

        Route::put('/settings/invitation-visibility', [InvitationSettingController::class, 'update'])->name('settings.invitation-visibility');

        Route::prefix('team')->name('team.')->group(function () {
            Route::get('/', [TeamController::class, 'index'])->name('index');
            Route::patch('/{user}', [TeamController::class, 'update'])->name('update');
            Route::delete('/{user}', [TeamController::class, 'destroy'])->name('destroy');
        });
    });

});

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::inertia('dashboard', 'dashboard')->name('dashboard');
// });

require __DIR__.'/settings.php';
