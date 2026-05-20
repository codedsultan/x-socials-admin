<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * moderation_queue
 *
 * Tracks comments that require human review.
 * Populated automatically by the background scanner when it flags comments
 * with verdict 'review' or 'remove'.
 *
 * Lifecycle:
 *   pending → reviewed (admin keeps it) | removed (admin deletes from Node API)
 *
 * A record stays in the queue until an admin explicitly acts on it.
 * Removing a comment from the Node API automatically moves the queue entry
 * to 'removed'. Keeping it moves to 'reviewed'.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moderation_queue', function (Blueprint $table) {
            $table->id();
            $table->string('comment_id', 36)->unique()->index();  // one queue entry per comment
            $table->string('post_id', 36)->index();
            $table->string('author_id', 36)->index();
            $table->text('content');
            $table->enum('verdict', ['review', 'remove'])->index(); // only flagged items enter the queue
            $table->unsignedSmallInteger('confidence_pct');
            $table->text('explanation');
            $table->json('flagged_phrases')->default('[]');

            $table->enum('status', ['pending', 'reviewed', 'removed'])
                  ->default('pending')
                  ->index();

            $table->string('resolved_by', 36)->nullable(); // admin user UUID from Node
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_note')->nullable();

            $table->foreignId('moderation_record_id')
                  ->constrained('moderation_records')
                  ->cascadeOnDelete();

            $table->timestamps();

            $table->index(['status', 'verdict', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_queue');
    }
};
