<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moderation_queue', function (Blueprint $table) {
            $table->id();
            $table->string('comment_id', 36)->nullable()->index();
            $table->string('post_id', 36)->index();
            $table->string('author_id', 36)->index();
            $table->text('content');
            $table->string('verdict', 20)->index();  // review, remove
            $table->unsignedSmallInteger('confidence_pct');
            $table->text('explanation');
            $table->json('flagged_phrases')->nullable();
            $table->string('status', 20)->default('pending')->index();  // pending, reviewed, removed, auto_removed
            $table->string('resolved_by', 36)->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_note')->nullable();
            $table->foreignId('moderation_record_id')
                ->constrained('moderation_records')
                ->cascadeOnDelete();
            $table->string('content_type', 20)->default('comment')->comment('comment, post');
            $table->string('content_id', 36)->comment('ID of comment or post');
            $table->timestamps();

            $table->unique(['content_id', 'content_type']);
            $table->index(['status', 'verdict', 'created_at']);
            $table->index(['content_id', 'content_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_queue');
    }
};
