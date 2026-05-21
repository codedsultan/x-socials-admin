# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Before writing any code
1. Read the implementation plan fully
2. Run the health-check skill to confirm the project is green
3. Check existing code in the affected area to match local patterns
4. If the plan is ambiguous, ask for clarification. Do not guess.

## Implementation rules
- Always add `declare(strict_types=1)` to every PHP file
- Controllers must be thin: validate via FormRequest, delegate to Service, return Resource
- All business logic goes in Services, never in controllers or models
- Use Eloquent relationships and scopes, avoid raw DB:: queries
- Use Enums for any field that has a fixed set of values
- Type everything: parameters, return types, properties
- Create or update Pest tests for every change (Feature for endpoints, Unit for services)
- Run health-check skill after implementation is complete

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

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v13
- laravel/prompts (PROMPTS) - v0
- laravel/wayfinder (WAYFINDER) - v0
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA_REACT) - v3
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0
- eslint (ESLINT) - v9
- prettier (PRETTIER) - v3

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `pnpm run build`, `pnpm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `pnpm run build` or ask the user to run `pnpm run dev` or `composer run dev`.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

# PHPUnit

- This application uses PHPUnit for testing. All tests must be written as PHPUnit classes. Use `php artisan make:test --phpunit {name}` to create a new test.
- If you see a test using "Pest", convert it to PHPUnit.
- Every time a test has been updated, run that singular test.
- When the tests relating to your feature are passing, ask the user if they would like to also run the entire test suite to make sure everything is still passing.
- Tests should cover all happy paths, failure paths, and edge cases.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files; these are core to the application.

## Running Tests

- Run the minimal number of tests, using an appropriate filter, before finalizing.
- To run all tests: `php artisan test --compact`.
- To run all tests in a file: `php artisan test --compact tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `php artisan test --compact --filter=testName` (recommended after making a change to a related file).

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
