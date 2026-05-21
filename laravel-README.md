# X-Socials Admin Panel

Laravel 13 + Inertia.js + React admin panel for the x-socials moderation
system. Provides the human review queue, dashboard, on-demand content
analysis, and the scheduled jobs that drive automated enforcement.

## Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 (PHP 8.3+) |
| Frontend | Inertia.js + React 19 + TypeScript |
| Styling | Tailwind CSS (dark theme) |
| Icons | Lucide React |
| Charts | Recharts |
| HTTP client | Laravel Http (Guzzle) |

## How it fits in the system

```
x-socials (Node.js)          x-socials-moderator (FastAPI)
      │                               │
      │ HMAC-signed admin API         │ POST /scan/trigger (daily)
      │ DELETE /admin/posts/:id       │ POST /moderate/analyse (on-demand)
      │ DELETE /admin/comments/:id    │ GET /health (dashboard)
      └──────────────────┬────────────┘
                         │
                   Laravel (this service)
                         │
                    MySQL (shared)
                    ├─ moderation_records   audit log written by FastAPI
                    ├─ moderation_queue     human review inbox
                    ├─ scan_runs            reconciliation sweep log
                    └─ admin_action_logs    full audit trail (human + system)
```

The admin panel does not analyse content itself. It reads results that
FastAPI has already written to the shared MySQL database, and calls the
Node.js admin API when content needs to be deleted.

FastAPI writes → MySQL ← Laravel reads. No message queue between them.

## Three enforcement paths

### 1. Auto-remove (every 5 minutes)
`moderation:auto-remove` runs via the Laravel scheduler. Items with
`verdict=remove` and `confidence_pct >= 95` are deleted from the Node.js
platform automatically without waiting for human review. Every action is
logged in `admin_action_logs` with `actor_id=0` (system actor).

### 2. Human review (queue page)
Admins review items in `moderation_queue` with `status=pending`. Keep
(marks reviewed, no deletion) or Remove (calls Node.js delete endpoint,
marks removed). Actions logged with the acting admin's ID and email.

### 3. On-demand analysis (moderation page)
Admins paste a post ID to inspect its post content and all comments.
Results are served from `moderation_records` (no AI call on page load).
For borderline cases, a Re-analyse dropdown lets admins escalate to a
higher-quality model via FastAPI's on-demand endpoint.

## Stack

| Layer | Technology |
|---|---|
| Framework | Laravel 11 |
| Frontend | Inertia.js + React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Laravel Fortify (admin guard) |
| HTTP client | Laravel HTTP (wraps Guzzle) |
| Queue | Laravel scheduler (no separate queue worker needed) |
| DB | MySQL (shared with FastAPI moderator) |

## Setup

### Requirements

- PHP 8.3+
- Composer
- Node.js 22+
- MySQL 8.0+ (shared with FastAPI service)

### Install

```bash
cp .env.example .env
composer install
npm install

php artisan key:generate
php artisan migrate
php artisan db:seed --class=AdminUserSeeder

npm run build
php artisan serve
```

### Environment

```env
# Laravel
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=x_socials_admin
DB_USERNAME=...
DB_PASSWORD=...

# Node.js social platform API
XSOCIALS_API_URL=http://localhost:3000
XSOCIALS_ADMIN_TOKEN=...        # shared secret for HMAC request signing

# FastAPI moderation service
MODERATOR_URL=http://localhost:8001
MODERATOR_API_KEY=              # optional — matches FastAPI API_KEY setting

# Auto-remove threshold (0.0–1.0)
# Items with verdict=remove AND confidence >= this are deleted automatically.
# Must be higher than FastAPI's REMOVE_THRESHOLD (0.85) — the gap is the
# "high confidence but still needs human eyes" band.
MODERATION_AUTO_ENFORCE_THRESHOLD=0.95
```

### Docker

```bash
cp .env.example .env
docker compose up -d admin
```

### Running the scheduler

The scheduler drives both automated enforcement and the daily reconciliation
scan. In production, add one cron entry:

```cron
* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
```

This runs every minute. Laravel's scheduler handles the per-job frequency
internally (`everyFiveMinutes`, `dailyAt`).

For local development, run the scheduler in the foreground:

```bash
php artisan schedule:work
```

## Scheduled jobs

### `moderation:auto-remove` — every 5 minutes

Finds queue items where:
- `status = 'pending'`
- `verdict = 'remove'`
- `confidence_pct >= MODERATION_AUTO_ENFORCE_THRESHOLD × 100`

For each item, calls the correct Node.js endpoint based on `content_type`:
- Posts → `DELETE /api/admin/posts/:id`
- Comments → `DELETE /api/admin/comments/:id`

Updates queue status to `auto_removed` and writes to `admin_action_logs`
regardless of whether the Node.js API call succeeded (the content may already
be deleted). `api_success` in the log `meta` column records the outcome.

**Dry-run preview:**
```bash
php artisan moderation:auto-remove --dry-run
```

**Override threshold for one run:**
```bash
php artisan moderation:auto-remove --threshold=0.98
```

### `moderation:scan --mode=reconciliation` — daily at 03:00 UTC

Calls FastAPI `POST /scan/trigger` with `mode=reconciliation`. FastAPI sweeps
the last 48 hours for content with no `moderation_records` row and analyses
the gaps. This covers:
- Items the real-time webhook dropped (FastAPI timeout, restart)
- Content edited after the initial analysis
- Historical content pre-dating the moderation system

```bash
# Manual trigger
php artisan moderation:scan --mode=reconciliation

# Standard scan (1-hour window, on-demand)
php artisan moderation:scan

# Scope to a single post
php artisan moderation:scan --post=6849f2a1c3d4e5f6a7b8c901

# Override model for this run
php artisan moderation:scan --model=anthropic/claude-sonnet-4-5
```

## Pages

### Dashboard (`/`)

Overview of platform health:
- User and post counts (from Node.js API)
- Pending queue counts — remove vs review
- Real-time webhook queue stats (from FastAPI `/health`)
- 7-day pipeline split — realtime vs reconciliation vs manual
- Last reconciliation scan status
- Node.js API and FastAPI moderator health indicators

The pipeline split bar shows what fraction of content was analysed by the
real-time webhook vs caught by the daily reconciliation scan. A healthy system
shows ≥ 90% realtime.

### Review Queue (`/queue`)

Paginated inbox of `moderation_queue` items with `status=pending`.

- Ordered by severity: `remove` items first, then `review`
- Filterable by verdict (`remove`/`review`) and content type (`post`/`comment`)
- Counts badge in the header (single GROUP BY query — one DB round-trip)
- Keep → marks `reviewed`, no deletion
- Remove → calls Node.js delete API, marks `removed`

Both actions are logged in `admin_action_logs` with the acting admin's
ID, email, IP address, and the item's confidence score.

### Moderation (`/moderation`)

Ad-hoc content investigation by Post ID.

Shows the post and all its comments. Analysis is loaded from
`moderation_records` — **no AI call on page load**. Comments not yet
scanned show a "Pending scan" pill.

Clicking a row opens an analysis modal showing:
- Stored verdict, confidence, categories, flagged phrases, explanation
- Which model produced the result and when (`analysedAt` timestamp)
- A Re-analyse dropdown to escalate to a higher-quality model for borderline cases
  (fires a live call to FastAPI `/moderate`)

### Users (`/users`)

User management — view profiles, suspend accounts.

### Posts (`/posts`)

Post browser — view content, delete posts.

## Database tables

All tables are in the shared MySQL database written by FastAPI and read
by Laravel. Laravel owns `admin_users` and `admin_action_logs`. FastAPI
owns writes to the rest.

| Table | Owner | Description |
|---|---|---|
| `moderation_records` | FastAPI writes | Append-only analysis audit log |
| `moderation_queue` | FastAPI writes | Human review inbox |
| `scan_runs` | FastAPI writes | Reconciliation sweep operational log |
| `admin_users` | Laravel | Admin panel accounts |
| `admin_action_logs` | Laravel | Full audit trail — human + system actions |

### Unique constraint on `moderation_records`

```sql
UNIQUE KEY uq_moderation_daily (content_id, content_type, created_date)
```

`created_date` is a generated column (`DATE(created_at)`). Prevents duplicate
rows when the real-time webhook and the reconciliation scan run concurrently
on the same content. `INSERT IGNORE` on the FastAPI side absorbs the duplicate
silently — the first write wins.

## HMAC request signing

All calls to the Node.js admin API are signed with HMAC-SHA256:

```
signature = HMAC-SHA256(
  key:     XSOCIALS_ADMIN_TOKEN,
  message: timestamp + "." + request_body_hash
)
```

The Node.js service verifies the signature and rejects requests older than
5 minutes (replay protection). Implemented in `XSocialsApiService`.

## Audit log

Every moderation action writes a row to `admin_action_logs`:

| Field | Description |
|---|---|
| `actor_id` | Admin user ID. `0` = system (auto-remove scheduler) |
| `actor_email` | `system@auto-moderator` for automated actions |
| `action` | `auto_remove` / `resolve_queue_item` / `dismiss_queue_item` / `delete_comment` |
| `target_type` | `post` or `comment` |
| `target_id` | Content ID |
| `meta` | JSON — confidence, threshold, verdict, api_success, model |
| `ip` | Admin IP address (`null` for system actions) |

Query all auto-removals from today:
```sql
SELECT target_type, target_id,
       JSON_EXTRACT(meta, '$.confidence_pct') as confidence,
       JSON_EXTRACT(meta, '$.api_success') as api_ok,
       created_at
FROM admin_action_logs
WHERE action = 'auto_remove'
  AND DATE(created_at) = CURDATE()
ORDER BY created_at DESC;
```

## Related services

| Service | Role |
|---|---|
| [x-socials](../x-socials-admin-moderation) | Node.js social platform — content source |
| [x-socials-moderator](../x-socials-ai-moderator-main) | FastAPI AI engine — analyses content, writes results |
