<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('moderation_records', function (Blueprint $table) {
            // Check database driver for compatibility
            $driver = DB::connection()->getDriverName();

            if ($driver === 'mysql') {
                // MySQL: Use generated virtual column
                $table->date('created_date')
                    ->virtualAs(DB::raw('DATE(created_at)'))
                    ->after('created_at');
            } elseif ($driver === 'pgsql') {
                // PostgreSQL: Use generated column (PostgreSQL 12+)
                $table->date('created_date')
                    ->storedAs('DATE(created_at)')
                    ->after('created_at');
            } else {
                // Fallback for other databases: regular column + index
                $table->date('created_date')->after('created_at');
            }

            // Add unique constraint for all databases
            $table->unique(['content_id', 'content_type', 'created_date'], 'uq_moderation_daily');
        });
    }

    public function down(): void
    {
        Schema::table('moderation_records', function (Blueprint $table) {
            $table->dropUnique('uq_moderation_daily');
            $table->dropColumn('created_date');
        });
    }
};
