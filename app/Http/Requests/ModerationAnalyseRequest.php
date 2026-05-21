<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ModerationAnalyseRequest extends FormRequest
{
    /**
     * @return array<string, array<string>>
     */
    public function rules(): array
    {
        return [
            'id' => ['required', 'string'],
            'content' => ['required', 'string'],
            'authorId' => ['nullable', 'string'],
            'force_model' => ['nullable', 'string'],
        ];
    }
}
