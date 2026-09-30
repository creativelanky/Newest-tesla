-- ============================================================================
-- migration-06  --  Run after migration-05 in the Supabase SQL Editor.
-- Lets admins record approved deposits that appear in user funding history.
-- ============================================================================

create or replace function admin_create_deposit(
  p_user_id uuid,
  p_amount numeric,
  p_method funding_method,
  p_reference text default ''
)
returns funding_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row funding_requests;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  if p_amount <= 0 then raise exception 'Deposit amount must be greater than $0.'; end if;
  if not exists (select 1 from profiles where id = p_user_id) then raise exception 'User not found.'; end if;

  insert into funding_requests (profile_id, kind, method, amount, reference, status, note, decided_at)
  values (p_user_id, 'deposit', p_method, p_amount, coalesce(p_reference, ''), 'approved', 'Recorded by admin', now())
  returning * into v_row;

  update profiles
  set balance = balance + p_amount,
      deposit_total = deposit_total + p_amount
  where id = p_user_id;

  insert into transactions (profile_id, type, label, amount)
  values (p_user_id, 'credit', 'Deposit approved - ' || p_method::text, p_amount);

  perform notify(p_user_id, 'deposit', 'Deposit approved',
    'Your deposit of $' || trim(to_char(p_amount, 'FM999999990.00')) || ' has been approved and credited.');
  return v_row;
end;
$$;

-- Keep deposit totals correct when an admin reopens a decided request.
create or replace function admin_revert_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r funding_requests;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;

  select * into r from funding_requests where id = p_request_id;
  if not found then raise exception 'Request not found.'; end if;
  if r.status = 'pending' then raise exception 'Request is already pending.'; end if;

  if r.kind = 'deposit' and r.status = 'approved' then
    update profiles
    set balance = greatest(0, balance - r.amount),
        deposit_total = deposit_total - r.amount
    where id = r.profile_id;
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'debit', 'Deposit reopened (reverted to pending) - ' || r.method::text, r.amount);
  elsif r.kind = 'withdrawal' and r.status = 'rejected' then
    update profiles
    set balance = greatest(0, balance - r.amount),
        deposit_total = deposit_total - r.amount
    where id = r.profile_id;
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'debit', 'Withdrawal re-held (reverted to pending) - ' || r.method::text, r.amount);
  end if;

  update funding_requests set status = 'pending', decided_at = null, note = '' where id = p_request_id;

  perform notify(
    r.profile_id, r.kind, 'Request reopened',
    'Your ' || r.kind || ' of $' || trim(to_char(r.amount, 'FM999999990.00')) || ' is under review again.'
  );
end;
$$;
