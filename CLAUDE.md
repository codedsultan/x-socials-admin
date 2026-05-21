# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (starts Laravel, queue, pail log viewer, and Vite concurrently)
composer run dev

# Or run individually:
php artisan serve
pnpm run dev

# PHP linting (Pint)
composer run lint          # fix in place
composer run lint:check    # check only

# Frontend linting / formatting / type-checking
pnpm run lint              # ESLint (fix)
pnpm run lint:check        # ESLint (check only)
pnpm run format            # Prettier (fix)
pnpm run format:check      # Prettier (check only)
pnpm run types:check       # tsc --noEmit

# Tests
php artisan test
# Single test file:
php artisan test tests/Feature/SomeTest.php

# Run everything (lint + types + tests) — mirrors CI:
composer run ci:check
```

## Architecture

This is a **read-only-from-the-outside admin panel**. It never connects directly to the x-socials content database. All content (users, posts, comments) is fetched/mutated through:

1. **Node.js API** (`XSOCIALS_API_URL`) — proxied via `XSocialsApiService`. Admin endpoints use HMAC request signing (see below). Public endpoints (posts, comments) are unsigned.
2. **FastAPI AI moderation service** (`MODERATOR_URL`) — proxied via `ModeratorService`. Handles on-demand analysis, batch analysis, and background scan triggers.

The **local SQLite database** exists only for admin-panel-specific data:
- `moderation_records` — cached AI analysis results written by FastAPI during scans
- `moderation_queue` — items awaiting human review (pending/reviewed/removed/auto_removed)
- `admin_action_logs` — append-only audit trail of every admin action
- `scan_runs` — metadata about each background scan job
- `users` — admin panel login accounts (managed by Fortify)

## HMAC Signing

`XSocialsApiService::http()` signs admin requests. The canonical string is:

```
METHOD\n<stripped-path>\n<timestamp>\n<sha256-of-body>
```

The **signed path must be the segment AFTER `/api/admin`** — exactly what Express receives as `req.path` inside the middleware. For example, `GET /api/admin/users` is signed with `/users`, not `/api/admin/users`. Mismatching this will produce 403 errors on the Node side.

## Key Files

| File | Purpose |
|---|---|
| `app/Services/XSocialsApiService.php` | All calls to the Node.js API; HMAC signing logic |
| `app/Services/ModeratorService.php` | All calls to the FastAPI AI service |
| `app/Models/ModerationRecord.php` | Cached scan results (`confidence_pct` stored as integer 0–100; `confidenceFloat()` divides by 100) |
| `app/Models/ModerationQueue.php` | Human review queue; `resolve()` stamps status + resolved_by + resolved_at |
| `app/Models/AdminActionLog.php` | Audit log; `AdminActionLog::record()` is the only write path |
| `app/Console/Commands/AutoRemoveCommand.php` | `php artisan moderation:auto-remove [--dry-run] [--threshold=0.95]` |

## Frontend

Inertia.js + React 19 + TypeScript. Pages live in `resources/js/pages/` (PascalCase directories matching controller convention). Shared types are in `resources/js/types/index.ts`.

**Wayfinder** auto-generates typed route action helpers into `resources/js/actions/` — do not edit those files manually. Run `php artisan wayfinder:generate` (or simply run `pnpm run dev`) to regenerate after route changes.

**UI components** in `resources/js/components/ui/` are Radix UI primitives wrapped with Tailwind. Use them rather than raw HTML for form controls, dialogs, and dropdowns.

Shared Inertia props (auth, flash messages) are typed in `SharedData` / `PageProps` in `resources/js/types/index.ts`. Flash toasts are handled by the `use-flash-toast` hook.

## Moderation Flow

1. **Background scan** — `ScanController` delegates to `ModeratorService::triggerScan()` → FastAPI reads MongoDB, calls Claude, writes rows to `moderation_records` and `moderation_queue`.
2. **Moderation page** (`/moderation?postId=X`) — loads comments from Node API, then hydrates analysis from `moderation_records` (no live AI call on page load). `fromCache: true` tells the frontend the result is stored; `null` means "not yet scanned".
3. **On-demand analysis** — `ModerationController::analyse()` calls `ModeratorService::moderate()` for a single comment. Returns JSON; does **not** write to the database.
4. **Queue review** (`/queue`) — humans keep or remove flagged items via `QueueController`. Both branches (post vs. comment) branch on `content_type` and call the correct API method.
5. **Auto-remove** — `moderation:auto-remove` command removes `pending` queue items with `verdict=remove` above the configured confidence threshold (default: `AUTO_ENFORCE_THRESHOLD=0.95`).

## Environment Variables

```
XSOCIALS_API_URL=http://localhost:4000/api
XSOCIALS_ADMIN_TOKEN=<hmac-key from Node API>
MODERATOR_URL=http://localhost:8001
AUTO_ENFORCE_THRESHOLD=0.95   # confidence floor for auto-remove
```
