# Contributing to WageWatchers

Thank you for your interest in contributing to WageWatchers! 🎉

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- [Node.js 18+](https://nodejs.org/)
- Git

### Setup (5 minutes)

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/wagewatchers.git
   cd wagewatchers
   ```

2. **Run the setup script**

   **Windows (PowerShell):**
   ```powershell
   .\setup.ps1
   ```

   **Mac/Linux:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   This will:
   - ✅ Start PostgreSQL container
   - ✅ Install dependencies
   - ✅ Initialize the database
   - ✅ Create `.env` from `.env.example`

3. **Create an admin user**

   ```bash
   npm run create-admin
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

### Manual Setup

If you prefer not to use the script, see [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md) for step-by-step instructions.

---

## 🛠️ Development Workflow

### Working on Features

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   The project structure:
   - `src/app/` - Next.js pages (App Router)
   - `src/components/` - Reusable React components
   - `src/lib/` - Utilities and configurations
   - `drizzle/` - Database schema and migrations

3. **Test locally**

   ```bash
   npm run dev
   npm run lint
   npm run format:check
   ```

4. **Check database changes**

   If you modified the schema:
   ```bash
   npm run db:generate  # Generate migration
   npm run db:push      # Apply changes
   ```

5. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Build process or auxiliary tool changes

6. **Push and create a Pull Request**

   ```bash
   git push origin feature/your-feature-name
   ```

   Then open a PR on GitHub!

---

## 📁 Project Structure

```
wagewatchers/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── [locale]/          # Localized routes (en, nl, fr, de)
│   │   ├── api/               # API routes
│   │   └── admin/             # Admin panel (no locale prefix)
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   └── statistics/        # Chart components
│   ├── lib/                   # Utilities and configs
│   │   ├── db/                # Drizzle ORM setup
│   │   ├── config/            # Country configs
│   │   └── validations/       # Zod schemas
│   ├── messages/              # i18n translations
│   └── types/                 # TypeScript types
├── drizzle/                   # Database schema & migrations
├── scripts/                   # Utility scripts
└── docs/                      # Documentation
```

---

## 🌍 Adding Translations

WageWatchers supports `en`, `nl`, `fr`, and `de`.

### To add new translations:

1. Edit `src/messages/{locale}.json`
2. Add your translation keys:

   ```json
   {
     "Dashboard": {
       "title": "Dashboard"
     }
   }
   ```

3. Use in components:

   **Server Component:**
   ```tsx
   import { getTranslations } from 'next-intl/server';

   const t = await getTranslations('Dashboard');
   return <h1>{t('title')}</h1>;
   ```

   **Client Component:**
   ```tsx
   'use client';
   import { useTranslations } from 'next-intl';

   const t = useTranslations('Dashboard');
   return <h1>{t('title')}</h1>;
   ```

---

## 🗄️ Database Changes

Using Drizzle ORM:

### 1. Modify the schema

Edit `drizzle/schema.ts`:

```typescript
export const salaryEntries = pgTable('salary_entries', {
  id: serial('id').primaryKey(),
  // Add your new field
  newField: varchar('new_field', { length: 255 }),
});
```

### 2. Generate migration

```bash
npm run db:generate
```

### 3. Apply migration

```bash
npm run db:push
```

### 4. View data

```bash
npm run studio
```

Opens Drizzle Studio at [http://localhost:4983](http://localhost:4983)

---

## 🧪 Testing

### Manual Testing

```bash
# Start containers
npm run docker:up

# Check health
npm run docker:health

# View logs
npm run docker:logs
```

### Testing Reddit Scraper

```bash
# Test post scraping
npm run test:scrape:posts

# Test comment fetching
npm run test:scrape:comments
```

---

## 🎨 Code Style

- **TypeScript** - Strongly typed code
- **ESLint** - Linting rules
- **Prettier** - Code formatting

Run before committing:

```bash
npm run lint        # Check for errors
npm run format      # Auto-format code
```

---

## 🐛 Reporting Bugs

Found a bug? Please open an issue with:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots** (if applicable)
5. **Environment** (OS, Browser, Node version)

---

## 💡 Feature Requests

Have an idea? Open an issue with:

1. **Problem description**
2. **Proposed solution**
3. **Alternatives considered**
4. **Additional context**

---

## 📋 Pull Request Guidelines

Before submitting a PR:

- ✅ Code follows project style (run `npm run lint`)
- ✅ All tests pass
- ✅ Database migrations are included (if schema changed)
- ✅ Translations are updated (if text changed)
- ✅ Documentation is updated (if needed)
- ✅ PR description explains what/why/how

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots
(if applicable)

## Checklist
- [ ] Linted and formatted
- [ ] Translations updated
- [ ] Database migrations included
- [ ] Documentation updated
```

---

## 🆘 Need Help?

- **Discord:** [Join our community](#) (coming soon)
- **Issues:** [GitHub Issues](https://github.com/Berthje/wagewatchers/issues)
- **Documentation:** [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md)

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Every contribution matters, whether it's:
- 🐛 Bug reports
- 💡 Feature ideas
- 📝 Documentation
- 🌍 Translations
- 💻 Code contributions

We appreciate your support! ❤️
