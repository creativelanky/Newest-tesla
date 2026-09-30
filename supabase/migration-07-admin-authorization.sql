-- ============================================================================
-- migration-07  --  Run once in the Supabase SQL Editor.
-- Keeps database admin authorization aligned with the support admin login.
-- ============================================================================

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and (role = 'admin' or lower(email) = 'support@endlesspeakinvestment.xyz')
  );
$$;
