<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add mode column to scan_runs.
 *
 * Distinguishes reconciliation sweeps (daily, 48h window, safety net for
 * webhook-missed items) from standard scans (short window, on-demand or manual).
 *
 * Default 'reconciliation' covers all existing rows written before this
 * migration — those were all triggered by the Laravel scheduler, which only
 * ever fires reconciliation-mode scans. Manual/on-demand scans are rare and
 * post-date this column.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::table('scan_runs', function (Blueprint $table) {
            $table->string('mode', 20)
                  ->default('reconciliation')
                  ->after('status')
                  ->comment('reconciliation | standard | manual');

            $table->index('mode');
        });
    }

    public function down(): void
    {
        Schema::table('scan_runs', function (Blueprint $table) {
            $table->dropIndex(['mode']);
            $table->dropColumn('mode');
        });
    }
};
