<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | x-socials Node.js API
    |--------------------------------------------------------------------------
    */
    'xsocials' => [
        'api_url' => env('XSOCIALS_API_URL', 'http://localhost:4000/api'),
        // Shared secret sent as X-Admin-Key header on every admin API call.
        // Must match ADMIN_API_KEY in the Node.js .env
        'admin_key' => env('XSOCIALS_ADMIN_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Moderation Service (FastAPI)
    |--------------------------------------------------------------------------
    */
    'moderator' => [
        'url' => env('MODERATOR_URL', 'http://localhost:8001'),
        'model' => env('MODERATOR_MODEL', 'claude-haiku-3-5-20251001'),
    ],
];
