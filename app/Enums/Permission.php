<?php

declare(strict_types=1);

namespace App\Enums;

enum Permission: string
{
    // Dashboard
    case ViewDashboard = 'view dashboard';

    // Users
    case ViewUsers = 'view users';
    case ManageUsers = 'manage users';

    // Posts
    case ViewPosts = 'view posts';
    case DeletePosts = 'delete posts';

    // Moderation
    case ViewModeration = 'view moderation';
    case AnalyseContent = 'analyse content';
    case DeleteContent = 'delete content';

    // Queue
    case ViewQueue = 'view queue';
    case ActionQueue = 'action queue';

    // Scans
    case TriggerScan = 'trigger scan';

    // Audit log
    case ViewAuditLog = 'view audit log';

    // Invitations
    case ViewInvitations = 'view invitations';
    case ManageInvitations = 'manage invitations';

    // Settings
    case ManageSettings = 'manage settings';
}
