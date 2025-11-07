# WageWatchers

A community-driven salary transparency platform for European markets. Compare
salaries, benefits, and work conditions with data from anonymous salary
discussions.

**Author:** Layton Berth (Berthje)

## 🚀 Quick Start with Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  (Windows/Mac/Linux)
- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) or npm

### 1. Clone the Repository

```bash
git clone https://github.com/Berthje/wagewatchers.git
cd wagewatchers
```

### 2. Start Database Container

```bash
docker-compose up -d
```

This will start **PostgreSQL** on `localhost:5433`

Verify container is running:

```bash
docker-compose ps
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update any values (the defaults work for local Docker
development).

### 4. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 5. Run Database Migrations

```bash
npm run db:push:dev
```

### 6. Seed Database with Sample Data

```bash
npm run db:seed:dev
```

This populates the database with:

- 10 sample salary entries (Belgium, Netherlands, France, Germany)
- Threaded comments
- Bug/feature reports
- Admin user (email: `admin@wagewatchers.dev`, password: `admin123`)
- **Real cities from CSV** (`public/data/cities.csv`) - falls back to minimal
  set if CSV not found
- Exchange rates and newsletter subscribers

⚠️ **Note**: The seed script only runs in development mode to prevent accidental
data loss in production.

### 7. Create Custom Admin User (Optional)

```bash
npm run create-admin:dev
```

Follow the prompts to create your own admin account.

### 8. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

---

## 🐳 Docker Commands

### Stop containers

```bash
docker-compose down
```

### Stop containers and remove volumes (⚠️ deletes all data)

```bash
docker-compose down -v
```

### View logs

```bash
docker-compose logs -f postgres
```

### Access PostgreSQL shell

```bash
docker exec -it wagewatchers-postgres psql -U postgres -d wagewatchers
```

---

## 📊 Database Management

### Drizzle Studio (Database GUI)

```bash
npm run studio:dev
```

Opens at [http://localhost:4983](http://localhost:4983)

### Development Database Commands

All development commands use the local Docker PostgreSQL instance
(`localhost:5433`):

```bash
# Generate migrations after schema changes
npm run db:generate:dev

# Push schema changes directly (recommended for dev)
npm run db:push:dev

# Apply migrations
npm run db:migrate:dev

# Introspect existing database
npm run db:introspect:dev

# Seed with sample data
npm run db:seed:dev

# Create admin user
npm run create-admin:dev

# Update cities data
npm run update-cities
```

---

## 🤖 Reddit Scraping System

WageWatchers automatically scrapes salary data from designated subreddits.

### Initial Setup

1. **Create Reddit App** at https://www.reddit.com/prefs/apps
   - App type: **script**
   - Redirect URI: `http://localhost:8080`
   - Note your **Client ID** and **Client Secret**

2. **Add to `.env`**:
   ```env
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   ```

### Testing Scrapers

```bash
# Test post scraping (fetches 10 latest posts)
npm run scrape:posts:dev

# Test comment fetching
npm run scrape:comments:dev

# Test field normalization
npm run test:normalizers:dev
```

### Features

✅ **OAuth Authentication** - Secure refresh token auth (no password needed)
✅ **Flair Filtering** - Only scrapes posts with "salary" flair
✅ **Field Normalization** - Transforms human text to standardized values:
- `"Prof Bachelor energy"` → `"bachelor"`
- `"2.5 Y"` → `2` years
- `"Unmarried"` → `"single"`
- Multi-language support (EN/NL/FR/DE)

✅ **Duplicate Detection** - Checks sourceUrl to avoid re-scraping
✅ **Template Validation** - Verifies post structure before saving
✅ **Markdown Handling** - Supports both `**bold**` and plain text formats
✅ **Unicode Normalization** - Handles zero-width spaces and special characters

### Subreddits Configured

- **r/BESalary** - Belgium salary discussions
- *(More can be added in `src/lib/salary-config.ts`)*

### Production Deployment

Automated scraping runs via **Vercel Cron Jobs**:
- Posts: Every 12 hours (2 AM UTC) - `/api/jobs/fetch-posts`
- Comments: Every 4 hours (6 AM UTC) - `/api/jobs/fetch-comments`

Protected by `CRON_SECRET` environment variable.

---

## 🔍 Field Normalization

The scraper intelligently normalizes human-written Reddit values:

| Field | Input Examples | Output |
|-------|---------------|---------|
| Education | "Prof Bachelor energy", "MA", "ingenieur" | `"bachelor"`, `"master"`, `"master"` |
| Civil Status | "Unmarried", "samenwonend", "living together" | `"single"`, `"cohabiting"`, `"cohabiting"` |
| Work Experience | "2.5 Y", "18 months", "5 years" | `2`, `1`, `5` |
| Contract Type | "vast", "cdi", "freelance" | `"permanent"`, `"permanent"`, `"freelance"` |
| Company Size | "startup", "multinational", "5000+" | `"1-10"`, `"1001-5000"`, `"5001+"` |

**Algorithm**: Exact match → Substring match → Fuzzy match (Levenshtein distance)

For full details, see [`docs/field-normalization.md`](docs/field-normalization.md)

---

## 🛠️ Development

### Project Structure

- `src/app/` - Next.js 15 App Router pages
- `src/components/` - React components
- `src/lib/` - Utilities, configs, database
  - `reddit-scraper.ts` - Reddit API integration
  - `field-normalizers.ts` - Value transformation logic
  - `salary-config.ts` - Subreddit templates & field mappings
- `drizzle/` - Database schema and migrations
- `src/messages/` - i18n translations (en, nl, fr, de)
- `scripts/` - Development utilities & test scripts

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier

# Database (Dev)
npm run db:push:dev     # Push schema changes
npm run db:seed:dev     # Seed sample data
npm run studio:dev      # Open Drizzle Studio
npm run create-admin:dev # Create admin user

# Reddit Scraping (Dev)
npm run scrape:posts:dev      # Test post scraping
npm run scrape:comments:dev   # Test comment fetching
npm run test:normalizers:dev  # Test field normalization

# Utilities
npm run update-cities  # Update cities from CSV
```

---

## 🌍 Internationalization

Supported locales: `en`, `nl`, `fr`, `de`

Translation files: `src/messages/{locale}.json`

All user-facing routes are locale-prefixed: `/[locale]/*`

---

## 🔒 Environment Variables

See `.env.example` for all available configuration options:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Admin session signing

### Reddit API (for scraping)
- `REDDIT_CLIENT_ID` - From https://www.reddit.com/prefs/apps
- `REDDIT_CLIENT_SECRET` - From your Reddit app

### Optional
- `CRON_SECRET` - Protects cron endpoints (production)
- `RESEND_API_KEY` - Email notifications
- `RESEND_FROM_EMAIL` - Sender email address
- `CURRENCY_CONVERSION_API` - Exchange rate API (future feature)

---

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

---

## 🙏 Acknowledgments

Built with:

- [Next.js 15](https://nextjs.org/) - React framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization
- [Recharts](https://recharts.org/) - Data visualization
- [Snoowrap](https://github.com/not-an-aardvark/snoowrap) - Reddit API client
- [fastest-levenshtein](https://github.com/ka-weihe/fastest-levenshtein) - String similarity
