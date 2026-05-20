<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * moderation_records
 *
 * Permanent store for every AI analysis result.
 * Records are append-only — we never update or delete them.
 * This gives a complete audit trail of every verdict ever issued.
 *
 * comment_id / post_id reference MongoDB ObjectIds in the Node.js app.
 * We store them as VARCHAR(36) — they are opaque references, never joined.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('moderation_records', function (Blueprint $table) {
            $table->id();
            $table->string('comment_id', 36)->index();
            $table->string('post_id', 36)->index();
            $table->string('author_id', 36)->index();    // Node.js user UUID
            $table->text('content');                      // snapshot at time of analysis
            // $table->enum('verdict', ['safe', 'review', 'remove'])->index();
            $table->string('verdict', 20)->index();
            $table->unsignedSmallInteger('confidence_pct'); // 0–100, stored as integer
            $table->json('categories');                   // ["hate_speech", "spam", ...]
            $table->text('explanation');
            $table->json('flagged_phrases');
            $table->string('model', 80);                  // which ai model was used

            // $table->enum('trigger', ['auto', 'manual'])
            //       ->default('auto')
            //       ->comment('auto = scheduled scan, manual = admin request');

            // Values: 'auto', 'manual'
            $table->string('trigger', 20)->default('auto')
                  ->comment('auto = scheduled scan, manual = admin request');
            $table->timestamps();                         // created_at = when analysed

            // Composite index: most common query is "all records for this comment"
            $table->index(['comment_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_records');
    }
};
