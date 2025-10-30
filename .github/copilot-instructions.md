# WageWatchers - AI Agent Instructions

## Project Overview

WageWatchers is a multi-country salary transparency platform built with **Next.js 15 (App Router)**, **Prisma**, **PostgreSQL**, and **next-intl** for i18n. The platform collects salary data from both manual submissions and automated Reddit scraping, featuring anonymous entry ownership and multi-language support.

## Architecture & Routing

### Internationalization (i18n)

-   **ALL user-facing routes** are locale-prefixed: `/[locale]/*` (e.g., `/en/dashboard`, `/fr/add`)
-   Root page (`app/page.tsx`) redirects to `/en` by default
-   **Admin routes are NOT localized**: `/admin/*` paths skip middleware (see `middleware.ts`)
-   Supported locales: `en`, `nl`, `fr`, `de` (defined in `src/i18n.ts`)
-   Translation files: `src/messages/{locale}.json`
-   Use `getTranslations()` in server components, `useTranslations()` in client components

### Key Route Patterns

```
/[locale]/dashboard       → Main salary data browser (server component)
/[locale]/add            → Manual entry form
/[locale]/my-entries     → User's owned entries (localStorage-based)
/[locale]/edit/[id]      → Edit entry (token-based auth)
/admin/login             → Admin authentication (no locale prefix)
/admin/reports           → Bug/feature report management
/api/entries             → CRUD operations for salary entries
/api/jobs/fetch-posts    → Cron job for Reddit scraping (every 12h)
/api/jobs/fetch-comments → Cron job for comment fetching (every 4h)
```

## Database Schema & Ownership Model

### Anonymous Ownership System

**Location**: `src/lib/entry-ownership.ts`

Users can manage entries WITHOUT traditional auth:

1. On entry creation, generate `ownerToken` (cryptographically secure) + `editableUntil` timestamp (1 day)
2. Store `ownerToken` in **browser localStorage** (`wagewatchers_entry_tokens` key)
3. User can edit/manage their entries by matching stored token with DB token
4. After edit window expires, entries become read-only

**Key functions**:

-   `generateOwnerToken()` - Creates base64url token
-   `storeEntryToken(entryId, token)` - Client-side storage
-   `getEntryToken(entryId)` - Retrieve for API calls
-   `isEntryEditable(editableUntil)` - Check if still within edit window

### Prisma Models

```prisma
SalaryEntry - 50+ fields covering salary, benefits, work conditions
  → ownerToken, editableUntil for anonymous ownership
  → source, sourceUrl for Reddit posts
  → isManualEntry flag distinguishes scraped vs manual submissions
  → currency field (default "EUR") for multi-currency support

Comment - Threaded comments from Reddit
  → Self-referential parent/replies relationship
  → Linked to SalaryEntry via salaryEntryId

Report - Bug/feature tracking with status/priority
  → trackingId for user follow-up

Admin - bcrypt-hashed passwords for admin access
```

## Country-Specific Configuration

**Location**: `src/lib/salary-config.ts`

### Subreddit Configs

Each country has a `SubredditConfig` defining:

-   **Country name** and **default currency**
-   **Template sections** (parsing structure for Reddit posts)
-   **Field mappings** (regex patterns for extracting data)

Example: `BESalary` subreddit → Belgium, EUR, 10 template sections

### Form Configs

`COUNTRY_FORM_CONFIGS` defines which fields appear per country:

-   Belgium: Full 50+ field form
-   Netherlands: Subset of Belgian fields
-   Add new countries by extending this config

**Field visibility**: Use `shouldDisplayField(fieldName, country)` to conditionally render form inputs

## Reddit Scraping System

**Core logic**: `src/lib/reddit-scraper.ts`

### Workflow

1. **Fetch Posts** (`/api/jobs/fetch-posts`):

    - Runs every 12 hours (Vercel Cron)
    - Scrapes configured subreddits (BESalary, NLSalary, etc.)
    - Parses structured salary templates using regex
    - Skips posts already in DB (checks `sourceUrl`)

2. **Fetch Comments** (`/api/jobs/fetch-comments`):
    - Runs every 4 hours
    - Fetches comments for entries ≤3 days old
    - Updates `lastCommentsFetch` to avoid redundant scraping
    - Creates threaded `Comment` records with parent/reply relationships

### Authentication

-   Uses `snoowrap` library with client credentials
-   Requires `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`
-   Protected by `CRON_SECRET` env var (Bearer token auth)

### Custom Parsing

`parseRedditPost()` extracts structured data from BESalary template format:

```markdown
1. PERSONALIA
   Age: 30
   Education: Master's degree
   ...
```

Extend `parseBESalaryTemplate()` for new fields or formats.

## Development Workflows

### Database Commands

```bash
npm run db:generate    # Generate Prisma Client after schema changes
npm run db:migrate     # Create & apply migration (prompts for name)
npm run db:seed        # Seed with sample data (prisma/seed.ts)
npm run create-admin   # Create admin user (scripts/create-admin.ts)
```

### Testing Scripts

```bash
npm run test:scrape:posts           # Test Reddit post scraping
npm run test:scrape:comments        # Test comment fetching
npm run test:parse:besalary         # Test BESalary template parsing
```

### Development Server

```bash
npm run dev     # Next.js dev server with Turbopack
npm run build   # Production build with Turbopack
```

## Component Patterns

### Server vs Client Components

-   **Server-first**: Most pages fetch data with Prisma in server components
-   **Client components** marked with `"use client"` for:
    -   Forms with `react-hook-form`
    -   Interactive UI (dashboards, modals)
    -   localStorage access (entry ownership)

### shadcn/ui Components

Custom UI components in `src/components/ui/`:

-   Built on Radix UI primitives
-   Styled with Tailwind + CVA (class-variance-authority)
-   See `components.json` for configuration

### Key Custom Components

-   `smart-city-input.tsx` - Autocomplete city selector
-   `currency-input.tsx` - Formatted currency input with locale support
-   `rich-text-editor.tsx` - TipTap editor for notes
-   `comment-thread.tsx` - Recursive threaded comment display
-   `animated-world-map.tsx` - SVG-based background decoration

## Rate Limiting & Security

**Location**: `src/lib/rate-limiter.ts`

-   **In-memory rate limiting** (5 submissions/day per IP)
-   Extracts client IP from `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip` headers
-   **Production consideration**: Replace with Redis/Upstash for multi-instance deployments

### Admin Authentication

-   JWT-based session cookies (`/api/admin/login`)
-   Passwords hashed with bcrypt
-   Client-side check: `localStorage.getItem("adminAuthenticated")`

## Environment Variables

Required for full functionality:

```env
DATABASE_URL                 # PostgreSQL connection string
REDDIT_CLIENT_ID             # Reddit API credentials
REDDIT_CLIENT_SECRET
REDDIT_USERNAME
REDDIT_PASSWORD
CRON_SECRET                  # Protects cron endpoints
RESEND_API_KEY              # Email notifications (optional)
RESEND_FROM_EMAIL           # Sender address
JWT_SECRET                  # Admin session signing
```

## Common Pitfalls

1. **Forgetting locale prefix**: User routes MUST include `[locale]` segment
2. **Manual entry filtering**: Check `isManualEntry` flag when querying scraped-only data
3. **Currency handling**: Always check `currency` field; defaults to EUR but supports multi-currency
4. **Entry ownership**: Client-side tokens in localStorage - no server-side user accounts
5. **Cron job auth**: Local testing without `CRON_SECRET` is allowed; production requires Bearer token

## Adding New Features

### New Country Support

1. Add subreddit config to `SUBREDDIT_CONFIGS` in `salary-config.ts`
2. Define form sections in `COUNTRY_FORM_CONFIGS`
3. Add translations to `src/messages/*.json`
4. Update Reddit scraping logic if template format differs

### New Form Fields

1. Add column to `SalaryEntry` model in `schema.prisma`
2. Run `npm run db:migrate` and provide descriptive migration name
3. Add field config to `src/lib/field-configs.ts`
4. Update country configs to include new field
5. Add translation keys to all locale files

### New Locale

1. Add locale code to `src/i18n.ts` locales array
2. Create `src/messages/{locale}.json` (copy `en.json` as template)
3. Update `LanguageToggle` component with new flag/option

## Testing Patterns

-   **Manual testing**: Use test scripts in `scripts/` directory
-   **Database reset**: `npx prisma migrate reset` (DEV ONLY - destructive!)
-   **Vercel deployments**: Cron jobs auto-configured via `vercel.json`
