-- ============================================================================
-- migration-03  —  run once in the Supabase SQL Editor.
-- Adds a custom suspension reason and lets admin_set_status carry it.
-- Self-contained (does not depend on migration-02).
-- ============================================================================

alter table profiles add column if not exists suspend_reason text not null default '';

-- Suspend/reinstate a user. When suspending, store the reason shown to them;
-- when reinstating, clear it.
create or replace function admin_set_status(p_user_id uuid, p_status account_status, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  update profiles set
    status = p_status,
    suspend_reason = case
      when p_status = 'suspended' then coalesce(nullif(p_reason, ''), suspend_reason, '')
      else ''
    end
  where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;
end;
$$;
