# Timewise

Track how you spend your time each day. AI-powered weekday vs weekend insights help you improve allocation and efficiency.

## Stack

- **Web**: Next.js 16, Tailwind 4, Supabase Auth
- **Mobile**: Expo 54, Expo Router
- **Shared**: `@timewise/core` (Zod schemas, time math, aggregation)
- **Database**: Supabase (PostgreSQL + RLS)

## Quick start (no Supabase CLI)

### 1. Database

Follow [docs/supabase-setup.md](docs/supabase-setup.md) — run the SQL migration in the Supabase Dashboard.

### 2. Web

```bash
cp .env.example apps/web/.env.local
# Fill in NEXT_PUBLIC_SUPABASE_* and OPENAI_API_KEY

pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Mobile (optional)

```bash
cp apps/mobile/.env.example apps/mobile/.env
# Set EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 plus Supabase keys

pnpm dev:mobile
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Next.js web dev server |
| `pnpm dev:mobile` | Expo dev server |
| `pnpm build` | Production web build |
| `pnpm test` | Core + web unit tests |

## Project structure

```
apps/web/          Next.js app + /api/v1/insights
apps/mobile/       Expo app (Today, Insights, Profile)
packages/core/     Shared types and time aggregation
supabase/migrations/  SQL to run manually in dashboard
```
