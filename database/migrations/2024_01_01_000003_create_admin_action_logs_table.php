<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * admin_action_logs
 *
 * Immutable audit trail of every action an admin takes through the panel.
 * Records are append-only — never updated or deleted.
 *
 * actor_id references a user UUID from the Node.js app (the admin who acted).
 * target_id references the affected resource (user UUID, post ObjectId, etc.)
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('admin_action_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor_id', 36)->index();          // admin who performed action
            $table->string('actor_email', 255);               // snapshot — survives user deletion
            // $table->enum('action', [
            //     'delete_post',
            //     'delete_comment',
            //     'set_role',
            //     'suspend_user',
            //     'reinstate_user',
            //     'resolve_queue_item',
            //     'dismiss_queue_item',
            // ])->index();

            $table->string('action', 50)->index();
            $table->string('target_type', 50);                // 'post' | 'comment' | 'user'
            $table->string('target_id', 36)->index();         // ID of affected resource
            $table->json('meta')->nullable();                 // before/after state, extra context
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();    // no updated_at — append-only

            $table->index(['actor_id',  'created_at']);
            $table->index(['target_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_action_logs');
    }
};
