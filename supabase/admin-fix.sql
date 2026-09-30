-- Patch: cast CASE-derived transaction type to the tx_type enum.
-- Fixes: 'column "type" is of type tx_type but expression is of type text'
-- on admin balance/profit actions. Safe to run once.

create or replace function admin_set_balance(p_user_id uuid, p_amount numeric, p_label text default 'Balance adjusted')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old numeric;
  v_delta numeric;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;

  select balance into v_old from profiles where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;

  v_delta := p_amount - v_old;
  update profiles set balance = p_amount where id = p_user_id;
  insert into transactions (profile_id, type, label, amount)
  values (p_user_id, (case when v_delta >= 0 then 'credit' else 'debit' end)::tx_type, p_label, abs(v_delta));
end;
$$;

create or replace function admin_adjust_balance(p_user_id uuid, p_delta numeric, p_label text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'User not found.';
  end if;

  update profiles set balance = greatest(0, balance + p_delta) where id = p_user_id;
  insert into transactions (profile_id, type, label, amount)
  values (
    p_user_id,
    (case when p_delta >= 0 then 'credit' else 'debit' end)::tx_type,
    coalesce(p_label, case when p_delta >= 0 then 'Credit applied' else 'Debit applied' end),
    abs(p_delta)
  );
end;
$$;

create or replace function admin_add_profit(p_user_id uuid, p_amount numeric, p_label text default 'Investment profit')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'User not found.';
  end if;

  update profiles set profit = profit + p_amount, balance = balance + p_amount where id = p_user_id;
  insert into transactions (profile_id, type, label, amount)
  values (p_user_id, (case when p_amount >= 0 then 'credit' else 'debit' end)::tx_type, p_label, abs(p_amount));
end;
$$;
