-- SpaceX Invest — money-moving logic as Postgres functions.
-- Run this AFTER schema.sql (Dashboard → SQL Editor → New query → paste → run).
--
-- Why functions instead of app code: every balance mutation needs to be
-- atomic (check-then-write without a race) and authorized against who the
-- caller actually is (auth.uid()), not whatever the browser claims. Doing
-- that in SECURITY DEFINER functions means the authorization and atomicity
-- live in the database itself — the Next.js API routes that call these are
-- thin wrappers, not the source of truth.

-- ============================================================================
-- User-initiated actions (run as the caller — auth.uid())
-- ============================================================================

-- Create a deposit request. Regular users have no direct INSERT policy on
-- funding_requests; this function is the only sanctioned way in.
create or replace function request_deposit(
  p_method funding_method,
  p_amount numeric,
  p_reference text default '',
  p_receipt_url text default null
)
returns funding_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_min numeric;
  v_row funding_requests;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount <= 0 then
    raise exception 'Enter an amount greater than $0.';
  end if;

  select min_deposit into v_min from platform_settings where id = 1;
  if p_amount < coalesce(v_min, 0) then
    raise exception 'Minimum deposit is $%', v_min;
  end if;

  insert into funding_requests (profile_id, kind, method, amount, reference, receipt_url, status)
  values (auth.uid(), 'deposit', p_method, p_amount, p_reference, p_receipt_url, 'pending')
  returning * into v_row;

  return v_row;
end;
$$;

-- Create a withdrawal request. Holds the funds immediately (debits balance,
-- logs a transaction) so the same money can't be spent twice while pending.
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

-- Submit KYC documents. `p_docs` is a JSON array of {doc_type, side, file_url}.
create or replace function submit_kyc(p_docs jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if jsonb_array_length(p_docs) = 0 then
    raise exception 'Attach at least one document.';
  end if;

  delete from kyc_docs where profile_id = auth.uid();

  for d in select * from jsonb_array_elements(p_docs)
  loop
    insert into kyc_docs (profile_id, doc_type, side, file_url)
    values (auth.uid(), d ->> 'doc_type', d ->> 'side', d ->> 'file_url');
  end loop;

  update profiles set kyc_status = 'pending', kyc_note = '' where id = auth.uid();
end;
$$;

-- Send a message. Regular users can only post as 'user' into their own
-- thread; admins can post as 'support' into anyone's.
create or replace function send_message(p_profile_id uuid, p_from message_from, p_text text)
returns messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row messages;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if trim(p_text) = '' then
    raise exception 'Write a message first.';
  end if;

  if p_from = 'support' then
    if not is_admin() then
      raise exception 'Only support can send as support.';
    end if;
  else
    if p_profile_id is distinct from auth.uid() then
      raise exception 'You can only message on your own behalf.';
    end if;
  end if;

  insert into messages (profile_id, "from", text)
  values (p_profile_id, p_from, p_text)
  returning * into v_row;

  if p_from = 'support' then
    update profiles set unread_for_user = unread_for_user + 1 where id = p_profile_id;
  else
    update profiles set unread_for_admin = unread_for_admin + 1 where id = p_profile_id;
  end if;

  return v_row;
end;
$$;

create or replace function mark_read(p_profile_id uuid, p_side message_from)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_side = 'user' and p_profile_id is distinct from auth.uid() then
    raise exception 'You can only clear your own inbox.';
  end if;
  if p_side = 'support' and not is_admin() then
    raise exception 'Admin only.';
  end if;

  if p_side = 'user' then
    update profiles set unread_for_user = 0 where id = p_profile_id;
  else
    update profiles set unread_for_admin = 0 where id = p_profile_id;
  end if;
end;
$$;

-- ============================================================================
-- Admin-only actions — every function re-checks is_admin() itself, so even
-- if an API route's own check were ever skipped, the database still refuses.
-- ============================================================================

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

create or replace function admin_set_profit(p_user_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  update profiles set profit = p_amount where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;
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

create or replace function admin_set_status(p_user_id uuid, p_status account_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  update profiles set status = p_status where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;
end;
$$;

create or replace function admin_decide_kyc(p_user_id uuid, p_status kyc_status, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  update profiles set kyc_status = p_status, kyc_note = p_note where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;
end;
$$;

create or replace function admin_save_settings(p_patch jsonb)
returns platform_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row platform_settings;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;

  update platform_settings set
    btc_address = coalesce(p_patch ->> 'btc_address', btc_address),
    btc_network = coalesce(p_patch ->> 'btc_network', btc_network),
    paypal_email = coalesce(p_patch ->> 'paypal_email', paypal_email),
    bank_name = coalesce(p_patch ->> 'bank_name', bank_name),
    bank_account_name = coalesce(p_patch ->> 'bank_account_name', bank_account_name),
    bank_account_number = coalesce(p_patch ->> 'bank_account_number', bank_account_number),
    bank_routing = coalesce(p_patch ->> 'bank_routing', bank_routing),
    bank_swift = coalesce(p_patch ->> 'bank_swift', bank_swift),
    min_deposit = coalesce((p_patch ->> 'min_deposit')::numeric, min_deposit),
    support_name = coalesce(p_patch ->> 'support_name', support_name)
  where id = 1
  returning * into v_row;

  return v_row;
end;
$$;

-- Note: user deletion is NOT a SQL function here. It's done via Supabase's
-- Admin API (auth.admin.deleteUser) from the server route, which correctly
-- cleans up Auth's internal identity/session tables too — a raw SQL DELETE
-- on auth.users would skip that. profiles + every FK-linked row still
-- cascades automatically from that deletion.
