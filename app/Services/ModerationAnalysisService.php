<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ModerationRecord;

class ModerationAnalysisService
{
    /**
     * Hydrate stored AI analysis for the given comment IDs.
     *
     * Returns a map of comment_id → analysis array (or null if not yet scanned).
     * The shape matches the live AI service response so the frontend needs no changes.
     *
     * @param  string[]  $commentIds
     * @return array<string, array<string,mixed>|null>
     */
    public function hydrateFromCache(array $commentIds): array
    {
        if (empty($commentIds)) {
            return [];
        }

        $records = ModerationRecord::query()
            ->forContentIds($commentIds)
            ->comments()
            ->orderBy('created_at', 'desc')
            ->get()
            ->unique('content_id')
            ->keyBy('content_id');

        $result = [];

        foreach ($commentIds as $cid) {
            $record = $records->get($cid);

            $result[$cid] = $record ? [
                'id' => $cid,
                'verdict' => $record->verdict->value,
                'confidence' => $record->confidenceFloat(),
                'categories' => $record->categories ?? [],
                'explanation' => $record->explanation,
                'flaggedPhrases' => $record->flagged_phrases ?? [],
                'model' => $record->model,
                'analysedAt' => $record->created_at?->toISOString(),
                'error' => false,
                'fromCache' => true,
            ] : null;
        }

        return $result;
    }
}
