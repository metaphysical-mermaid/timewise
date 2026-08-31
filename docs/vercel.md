# Vercel

Deploy `apps/web` as the Next.js app in this monorepo.

## Project settings

- **Root Directory:** `apps/web`
- **Framework:** Next.js
- **Install Command:** `pnpm install` (from repo root; include files outside root directory)
- **Build Command:** `pnpm build` (runs inside `apps/web`) or from root: `pnpm --filter web build`
- **Node.js:** 20.x

## Environment variables

Set for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (server-only)

Never put secrets in `NEXT_PUBLIC_*`.

## After deploy

1. In Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://YOUR_APP.vercel.app`
   - Redirect URLs: add `https://YOUR_APP.vercel.app/**` (and keep localhost for local dev)
2. Smoke test: sign up / sign in → Today → add entry → Insights
