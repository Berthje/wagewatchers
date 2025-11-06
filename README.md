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
npm run update-cities:dev
```

### Production Database Commands

These use the `DATABASE_URL` from your `.env` file:

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run studio
npm run seed  # ⚠️ Requires FORCE_SEED=true in production
```

---

## 🛠️ Development

### Project Structure

- `src/app/` - Next.js 15 App Router pages
- `src/components/` - React components
- `src/lib/` - Utilities, configs, database
- `drizzle/` - Database schema and migrations
- `src/messages/` - i18n translations (en, nl, fr, de)

### Available Scripts

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run create-admin # Create admin user
npm run studio       # Open Drizzle Studio
```

---

## 🌍 Internationalization

Supported locales: `en`, `nl`, `fr`, `de`

Translation files: `src/messages/{locale}.json`

All user-facing routes are locale-prefixed: `/[locale]/*`

---

## 🔒 Environment Variables

See `.env.example` for all available configuration options:

- `DATABASE_URL` - PostgreSQL connection string
- `CRON_SECRET` - Protects cron endpoints
- `RESEND_API_KEY` - Email notifications (optional)
- `JWT_SECRET` - Admin session signing

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

- [Next.js 15](https://nextjs.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
- [next-intl](https://next-intl-docs.vercel.app/)
- [Recharts](https://recharts.org/)
