<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InvitationSettingController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $visible = (bool) $request->input('invitation_request_visible');
        AppSetting::set('invitation_request_visible', $visible ? '1' : '0');

        return back()->with('success', 'Setting updated.');
    }
}
