<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * scan_runs
 *
 * One row per background moderation scan execution.
 * Records timing, how many comments were scanned, and summary counts.
 * Used for the admin dashboard "last scan" widget.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_runs', function (Blueprint $table) {
            $table->id();
            // $table->enum('status', ['running', 'completed', 'failed'])->default('running')->index();

            // Values: 'running', 'completed', 'failed'
            $table->string('status', 20)->default('running');
            $table->index('status');
            $table->unsignedInteger('posts_scanned')->default(0);
            $table->unsignedInteger('comments_scanned')->default(0);
            $table->unsignedInteger('flagged')->default(0);         // 'remove' verdicts
            $table->unsignedInteger('queued_for_review')->default(0); // 'review' verdicts
            $table->unsignedInteger('safe')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_runs');
    }
};
