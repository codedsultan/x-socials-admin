<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moderation_records', function (Blueprint $table) {
            $table->id();
            $table->string('comment_id', 36)->nullable()->index();
            $table->string('post_id', 36)->index();
            $table->string('author_id', 36)->index();
            $table->text('content');
            $table->string('verdict', 20)->index();  // safe, review, remove
            $table->unsignedSmallInteger('confidence_pct');
            $table->json('categories')->nullable();
            $table->text('explanation');
            $table->json('flagged_phrases')->nullable();
            $table->string('model', 80);
            $table->string('trigger', 20)->default('auto')->comment('auto, manual');
            $table->string('content_type', 20)->default('comment')->comment('comment, post');
            $table->string('content_id', 36)->index()->comment('ID of comment or post');
            $table->timestamps();

            $table->index(['content_id', 'created_at']);
            $table->index(['verdict', 'confidence_pct']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_records');
    }
};
