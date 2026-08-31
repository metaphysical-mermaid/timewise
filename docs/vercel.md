# Vercel

Production app: **https://timewise-web-seven.vercel.app**  
Vercel project: `metaphysical-mermaid/timewise-web`

## Current setup

Deployed via Vercel CLI from a standalone build of `apps/web` (with `@timewise/core` vendored). Env vars are set in the Vercel project for Production, Preview, and Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (server-only)

## After deploy — Supabase auth URLs

In Supabase → **Authentication → URL Configuration**:

1. **Site URL:** `https://timewise-web-seven.vercel.app`
2. **Redirect URLs** (add these; keep localhost for local dev):
   - `https://timewise-web-seven.vercel.app/**`
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3000/**`

## Redeploy

```bash
cd apps/web
vercel deploy --prod
```

For monorepo Git deploys later, set Root Directory to `apps/web` and install/build from the repo root with pnpm filters.

## Optional: connect GitHub for auto-deploys

1. Open [Vercel → timewise-web → Settings → Git](https://vercel.com/metaphysical-mermaid/timewise-web/settings/git)
2. Connect `metaphysical-mermaid/timewise`
3. Set **Root Directory** to `apps/web`
4. Enable including files outside the root directory (for `@timewise/core`)
5. Install Command: `cd ../.. && pnpm install`
6. Build Command: `cd ../.. && pnpm --filter web build`

## Smoke test

1. Open https://timewise-web-seven.vercel.app
2. Sign up / sign in
3. Add a time entry on Today
4. Try Insights (needs OpenAI key — already set)
