# Vercel

Production app: **https://timewise-web-seven.vercel.app**  
Vercel project: `metaphysical-mermaid/timewise-web`  
GitHub: `metaphysical-mermaid/timewise` (auto-deploys on push to `main`)

## How deploys work

Pushes to `main` trigger a production deploy. Preview deployments are created for other branches/PRs.

**Monorepo settings (already configured on the project):**

- Root Directory: `apps/web`
- Install: `cd ../.. && pnpm install`
- Build: `cd ../.. && pnpm --filter web build`
- Framework: Next.js

## Environment variables

Set in Vercel → Project → Settings → Environment Variables (Production + Preview):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (server-only)

## Supabase auth URLs

**Authentication → URL Configuration:**

- Site URL: `https://timewise-web-seven.vercel.app`
- Redirect URLs:
  - `https://timewise-web-seven.vercel.app/**`
  - `http://localhost:3000/**`
  - `http://127.0.0.1:3000/**`

## Manual redeploy

Vercel dashboard → Deployments → Redeploy, or:

```bash
git push origin main
```
