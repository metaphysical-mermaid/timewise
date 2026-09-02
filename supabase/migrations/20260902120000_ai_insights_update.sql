-- Allow updating ai_insights so follow-up Q&A can be persisted.
-- Safe to re-run.

grant update on public.ai_insights to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_insights'
      and policyname = 'ai_insights_update_own'
  ) then
    create policy ai_insights_update_own on public.ai_insights
      for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
