-- ============================================================================
-- migration-05  --  Run once in the Supabase SQL Editor.
-- Adds direct deposit/profit account figures for the simplified admin editor.
-- ============================================================================

alter table profiles add column if not exists deposit_total numeric(14, 2) not null default 0;

-- Carry existing accounts forward without changing their current balance.
update profiles
set deposit_total = balance - profit
where deposit_total = 0 and (balance <> 0 or profit <> 0);

create or replace function admin_set_account_figures(
  p_user_id uuid,
  p_deposit_total numeric,
  p_profit numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_balance numeric;
  v_balance numeric;
  v_delta numeric;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  v_balance := p_deposit_total + p_profit;
  if v_balance < 0 then raise exception 'Deposits plus profit cannot be below $0.'; end if;

  select balance into v_old_balance from profiles where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;

  update profiles
  set deposit_total = p_deposit_total,
      profit = p_profit,
      balance = v_balance
  where id = p_user_id;

  v_delta := v_balance - v_old_balance;
  if v_delta <> 0 then
    insert into transactions (profile_id, type, label, amount)
    values (
      p_user_id,
      (case when v_delta > 0 then 'credit' else 'debit' end)::tx_type,
      'Account figures updated',
      abs(v_delta)
    );
  end if;
end;
$$;

-- Keep the direct deposit figure current when funding requests are approved.
create or replace function admin_approve_request(p_request_id uuid, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare r funding_requests;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  select * into r from funding_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request is not pending.'; end if;

  if r.kind = 'deposit' then
    update profiles
    set balance = balance + r.amount,
        deposit_total = deposit_total + r.amount
    where id = r.profile_id;
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'credit', 'Deposit approved - ' || r.method::text, r.amount);
    perform notify(r.profile_id, 'deposit', 'Deposit approved',
      'Your deposit of $' || trim(to_char(r.amount, 'FM999999990.00')) || ' has been approved and credited.');
  else
    -- The withdrawal already reduced balance and deposit_total when requested.
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'debit', 'Withdrawal completed - ' || r.method::text, 0);
    perform notify(r.profile_id, 'withdrawal', 'Withdrawal sent',
      'Your withdrawal of $' || trim(to_char(r.amount, 'FM999999990.00')) || ' has been processed.');
  end if;

  update funding_requests set status = 'approved', decided_at = now(), note = p_note where id = p_request_id;
end;
$$;

create or replace function admin_reject_request(p_request_id uuid, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare r funding_requests;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  select * into r from funding_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request is not pending.'; end if;

  if r.kind = 'withdrawal' then
    update profiles
    set balance = balance + r.amount,
        deposit_total = deposit_total + r.amount
    where id = r.profile_id;
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'credit', 'Withdrawal declined - funds returned', r.amount);
    perform notify(r.profile_id, 'withdrawal', 'Withdrawal declined',
      'Your withdrawal was declined and $' || trim(to_char(r.amount, 'FM999999990.00')) || ' returned to your balance.'
      || case when coalesce(p_note,'') <> '' then ' Note: ' || p_note else '' end);
  else
    perform notify(r.profile_id, 'deposit', 'Deposit declined',
      'Your deposit could not be confirmed.'
      || case when coalesce(p_note,'') <> '' then ' Note: ' || p_note else '' end);
  end if;

  update funding_requests set status = 'rejected', decided_at = now(), note = p_note where id = p_request_id;
end;
$$;

create or replace function request_withdrawal(
  p_method funding_method, p_amount numeric, p_destination jsonb default '{}'::jsonb
)
returns funding_requests language plpgsql security definer set search_path = public as $$
declare v_balance numeric; v_kyc kyc_status; v_status account_status; v_row funding_requests;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_amount <= 0 then raise exception 'Enter an amount greater than $0.'; end if;

  select balance, kyc_status, status into v_balance, v_kyc, v_status from profiles where id = auth.uid() for update;
  if v_status = 'suspended' then raise exception 'This account has been suspended. Please contact support.'; end if;
  if v_kyc is distinct from 'verified' then raise exception 'Identity verification is required before withdrawing.'; end if;
  if p_amount > v_balance then raise exception 'Amount exceeds your available balance.'; end if;

  update profiles
  set balance = balance - p_amount,
      deposit_total = deposit_total - p_amount
  where id = auth.uid();
  insert into transactions (profile_id, type, label, amount)
  values (auth.uid(), 'debit', 'Withdrawal requested - ' || p_method::text, p_amount);
  insert into funding_requests (profile_id, kind, method, amount, destination, status)
  values (auth.uid(), 'withdrawal', p_method, p_amount, p_destination, 'pending')
  returning * into v_row;
  return v_row;
end;
$$;
