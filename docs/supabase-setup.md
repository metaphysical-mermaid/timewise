# Supabase setup (no CLI)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor → New query**.
3. Paste the full contents of `supabase/migrations/20260830120000_initial.sql` and click **Run**.
4. Under **Authentication → Providers**, enable **Email**.
5. Under **Authentication → URL Configuration** (for local web dev):
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`
6. Copy **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Copy `.env.example` to `apps/web/.env.local` and fill in values.

For schema changes later, add a new SQL file under `supabase/migrations/` and run it manually in the SQL Editor.

After the initial schema, also run:
- `supabase/migrations/20260902120000_ai_insights_update.sql` (follow-up Q&A persistence)
- `supabase/migrations/20260902121000_todos.sql` (daily todos)
