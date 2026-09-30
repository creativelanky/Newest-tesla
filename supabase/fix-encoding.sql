-- Patch: fixes a mangled "·" character that got corrupted during an earlier
-- copy/paste into the SQL editor (became "¬∑" — classic UTF-8 double-encoding).
-- Safe to run once. Re-creates the 4 affected functions with a plain ASCII
-- separator instead (immune to this class of copy/paste issue), then repairs
-- any transaction rows already written with the mangled text.

create or replace function request_withdrawal(
  p_method funding_method,
  p_amount numeric,
  p_destination jsonb default '{}'::jsonb
)
returns funding_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_kyc kyc_status;
  v_row funding_requests;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount <= 0 then
    raise exception 'Enter an amount greater than $0.';
  end if;

  select balance, kyc_status into v_balance, v_kyc from profiles where id = auth.uid() for update;

  if v_kyc is distinct from 'verified' then
    raise exception 'Identity verification is required before withdrawing.';
  end if;
  if p_amount > v_balance then
    raise exception 'Amount exceeds your available balance.';
  end if;

  update profiles set balance = balance - p_amount where id = auth.uid();

  insert into transactions (profile_id, type, label, amount)
  values (auth.uid(), 'debit', 'Withdrawal requested - ' || p_method::text, p_amount);

  insert into funding_requests (profile_id, kind, method, amount, destination, status)
  values (auth.uid(), 'withdrawal', p_method, p_amount, p_destination, 'pending')
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function admin_approve_request(p_request_id uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r funding_requests;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;

  select * into r from funding_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request is not pending.'; end if;

  if r.kind = 'deposit' then
    update profiles set balance = balance + r.amount where id = r.profile_id;
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'credit', 'Deposit approved - ' || r.method::text, r.amount);
  else
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'debit', 'Withdrawal completed - ' || r.method::text, 0);
  end if;

  update funding_requests set status = 'approved', decided_at = now(), note = p_note where id = p_request_id;
end;
$$;

create or replace function admin_reject_request(p_request_id uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r funding_requests;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;

  select * into r from funding_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request is not pending.'; end if;

  if r.kind = 'withdrawal' then
    update profiles set balance = balance + r.amount where id = r.profile_id;
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'credit', 'Withdrawal declined - funds returned', r.amount);
  end if;

  update funding_requests set status = 'rejected', decided_at = now(), note = p_note where id = p_request_id;
end;
$$;

-- Repair already-written rows (replaces the mangled bytes wherever they slipped in).
update transactions set label = replace(label, '¬∑', '-') where label like '%¬∑%';
