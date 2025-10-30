# WageWatchers

A community-driven salary transparency platform for European markets. Compare salaries, benefits, and work conditions with data from anonymous salary discussions.

**Author:** Layton Berth (Berthje)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prerequisites

Before you begin, make sure you have:
- Node.js installed
- PostgreSQL installed and running locally, OR
- Access to a hosted PostgreSQL database (e.g., Neon, Supabase, Railway, AWS RDS)

## Database Setup

This project uses PostgreSQL with Prisma ORM.

### Local PostgreSQL Setup

1. Install PostgreSQL on your machine if not already installed
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **macOS**: `brew install postgresql@15`
   - **Linux**: `sudo apt-get install postgresql`

2. Create a database:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE wagewatchers;

# Exit psql
\q
```

### Cloud PostgreSQL Setup (Recommended for Production)

You can use any of these hosted PostgreSQL providers:
- **Neon** (https://neon.tech) - Serverless PostgreSQL, free tier available
- **Supabase** (https://supabase.com) - PostgreSQL with additional features
- **Railway** (https://railway.app) - Simple deployment platform
- **Vercel Postgres** (https://vercel.com/docs/storage/vercel-postgres) - Integrated with Vercel

### Environment Variables

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Update the `DATABASE_URL` in `.env.local` with your PostgreSQL connection string:

**For local development:**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wagewatchers?schema=public"
```

**For production (example with connection pooling):**
```
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public&connection_limit=5&pool_timeout=10"
```

### Database Migration

Run the Prisma migration to create the database schema:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

## Email Configuration (Optional)

This application sends confirmation emails to users when they submit feedback reports.

### Setting up Resend

1. **Create a Resend Account:**
   - Go to https://resend.com and sign up
   - Verify your email address

2. **Get Your API Key:**
   - Navigate to https://resend.com/api-keys
   - Click "Create API Key"
   - Copy your API key

3. **Configure Email Domain (For Production):**
   - Go to https://resend.com/domains
   - Add your domain and verify it with DNS records
   - Wait for verification (usually takes a few minutes)

4. **Add to Environment Variables:**
   Update your `.env.local` file:
   ```env
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="WageWatchers <noreply@wagewatchers.com>"
   ```

### Development Mode

If `RESEND_API_KEY` is not configured, the application will:
- Log email content to the console instead of sending
- Continue working normally without errors
- Display helpful setup instructions in the logs

For development, you can use Resend's default sender:
```env
RESEND_FROM_EMAIL="WageWatchers <onboarding@resend.dev>"
```

**Note:** The default `onboarding@resend.dev` address can only send to the email you signed up with on Resend. For production use, you must verify your own domain.

## Rate Limiting

To prevent spam and abuse, the application implements rate limiting on feedback submissions:

### How it Works

- **Limit**: 5 feedback submissions per day per IP address
- **Reset**: Limits reset at midnight UTC
- **Storage**: In-memory (for production, consider Redis or database storage)
- **Identification**: Uses client IP address from request headers

### Features

- Automatic rate limit tracking
- User-friendly error messages with reset time
- Shows remaining submissions after successful submission
- Supports various proxy headers (x-forwarded-for, x-real-ip, cf-connecting-ip)
- Automatic cleanup of expired entries

### Customization

To change the rate limit, modify the limit parameter in `src/app/api/reports/route.ts`:

```typescript
const rateLimitResult = checkRateLimit(clientIP, 5); // Change 5 to your desired limit
```

### Production Considerations

The current implementation uses in-memory storage, which means:
- Rate limits are reset when the server restarts
- Not suitable for multi-instance deployments

For production with multiple instances, consider:
- Using Redis with `ioredis` or `@upstash/redis`
- Using a database table to track submissions
- Using a service like Upstash Rate Limiting

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Background Jobs (Reddit Scraping)

This application includes automated background jobs that scrape salary data and comments from Reddit.

### Reddit API Setup

1. **Create a Reddit App:**
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create App" or "Create Another App"
   - Choose "script" as the app type
   - Fill in the required fields:
     - **name**: WageWatcher Scraper
     - **redirect uri**: http://localhost:8080
   - Click "Create app"

2. **Get Your Credentials:**
   - After creation, note down:
     - **Client ID**: The string under "personal use script"
     - **Client Secret**: The "secret" field

3. **Add to Environment Variables:**
   Update your `.env.local` file:
   ```env
   REDDIT_CLIENT_ID="your_client_id_here"
   REDDIT_CLIENT_SECRET="your_client_secret_here"
   REDDIT_USERNAME="your_reddit_username"
   REDDIT_PASSWORD="your_reddit_password"
   CRON_SECRET="generate_a_secure_random_string"
   ```

### Cron Jobs Configuration

The application runs two automated jobs via Vercel Cron:

1. **Fetch New Posts** (`/api/jobs/fetch-posts`)
   - **Schedule**: Every 12 hours (`0 */12 * * *`)
   - **Purpose**: Scrapes new salary posts from configured subreddits (BESalary, NLSalary, etc.)
   - **Behavior**: Only creates entries for posts not already in the database

2. **Fetch Comments** (`/api/jobs/fetch-comments`)
   - **Schedule**: Every 4 hours (`0 */4 * * *`)
   - **Purpose**: Fetches comments for Reddit entries up to 3 days old
   - **Behavior**:
     - Only processes entries from external sources (not manual submissions)
     - Stops fetching comments for entries older than 3 days (inactive)
     - Updates the `lastCommentsFetch` timestamp to avoid redundant scraping
     - Processes up to 50 entries per run with rate limiting

### Manual Triggering

You can manually trigger the jobs for testing:

```bash
# Fetch new posts
curl -X POST http://localhost:3000/api/jobs/fetch-posts \
  -H "Authorization: Bearer your_cron_secret"

# Fetch comments
curl -X POST http://localhost:3000/api/jobs/fetch-comments \
  -H "Authorization: Bearer your_cron_secret"
```

### Security Notes

- The `CRON_SECRET` environment variable protects your cron endpoints from unauthorized access
- In production on Vercel, cron jobs are automatically authenticated
- For local testing, you can omit the `CRON_SECRET` during development

### Customizing Scraping Behavior

You can modify the scraping behavior in:
- `src/lib/reddit-scraper.ts` - Core scraping logic
- `src/app/api/jobs/fetch-posts/route.ts` - Post fetching configuration
- `src/app/api/jobs/fetch-comments/route.ts` - Comment fetching configuration
- `vercel.json` - Cron schedule configuration

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Deploying with Cron Jobs

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the repository to Vercel
3. Add the required environment variables in the Vercel dashboard:
   - `DATABASE_URL`
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
   - `REDDIT_USERNAME`
   - `REDDIT_PASSWORD`
   - `CRON_SECRET`
   - `RESEND_API_KEY` (optional, for email functionality)
   - `RESEND_FROM_EMAIL` (optional, for email functionality)
4. Deploy!

The `vercel.json` configuration will automatically set up the cron jobs.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
