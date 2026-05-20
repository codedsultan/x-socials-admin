# X-socials Admin

Laravel 13 + Inertia.js + React + TypeScript admin panel for the x-socials platform.

## Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 11 (PHP 8.2+) |
| Frontend | Inertia.js + React 19 + TypeScript |
| Styling | Tailwind CSS (dark theme) |
| Icons | Lucide React |
| Charts | Recharts |
| HTTP client | Laravel Http (Guzzle) |

## Setup

```bash
# 1. Install PHP dependencies
composer install

# 2. Install JS dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
php artisan key:generate

# 4. Set your x-socials API credentials in .env:
#    XSOCIALS_API_URL=http://localhost:4000/api
#    XSOCIALS_ADMIN_TOKEN=<access token from POST /api/auth/login>
#    MODERATOR_URL=http://localhost:8001

# 5. Build frontend assets
pnpm run dev       # development (with HMR)
pnpm run build     # production

# 6. Start Laravel
php artisan serve  # → http://localhost:8000
```

## Architecture

The admin panel **never connects to a database directly**. Every read and write
goes through the x-socials Node.js API using the `XSOCIALS_ADMIN_TOKEN` you
configure. This means:

- No database migration needed
- Admin actions go through the same validation as the public API
- Token can be revoked from the Node API to instantly lock out the admin

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Stats overview — users, posts, API health |
| `/users` | Users Index | Paginated user list |
| `/users/:id` | User Detail | Profile + their posts |
| `/posts` | Posts Index | Filterable post list with delete |
| `/posts/:id` | Post Detail | Full post + comments + delete |
| `/moderation` | Moderation Queue | AI-powered comment review |
| `/moderation?postId=:id` | Moderation — filtered | Load a specific post's comments |

## Moderation flow

1. Go to `/moderation`
2. Paste a Post ObjectId (copy from the Posts page)
3. Click **Analyse** — the admin sends all comments to the FastAPI AI service
4. Each comment shows a **verdict badge** (Safe / Review / Remove) with confidence
5. Click any row to open the detail modal — shows full AI explanation, flagged
   phrases, and category breakdown
6. Use **Keep comment** or **Remove comment** to take action


> **Note:** This is an evolving project
>
