-- ============================================================================
-- migration-02  —  run once in the Supabase SQL Editor (after schema.sql +
-- functions.sql). Idempotent: everything is create-or-replace / if-not-exists.
--
-- Bundles three things:
--   1. Enum-cast fix for the admin balance/profit functions
--   2. Suspension enforcement (suspended users can't deposit or withdraw)
--   3. Notifications: a table, auto-notifications on key events, and an
--      admin function to send custom notifications (to one user or everyone)
-- ============================================================================

-- ---- 1. Notifications table ------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  kind text not null default 'system',       -- system | admin | deposit | withdrawal | kyc | message
  title text not null,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_profile_idx on notifications (profile_id, created_at desc);

alter table notifications enable row level security;

drop policy if exists "notif_select_own" on notifications;
create policy "notif_select_own" on notifications for select
  using (profile_id = auth.uid() or is_admin());

drop policy if exists "notif_update_own" on notifications;
create policy "notif_update_own" on notifications for update
  using (profile_id = auth.uid());

-- Internal helper: raise a notification for one profile.
create or replace function notify(p_profile_id uuid, p_kind text, p_title text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (profile_id, kind, title, body)
  values (p_profile_id, p_kind, p_title, coalesce(p_body, ''));
end;
$$;

-- Mark all of the caller's notifications read.
create or replace function mark_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications set read = true where profile_id = auth.uid() and read = false;
end;
$$;

-- Admin: send a custom notification. Null p_user_id broadcasts to everyone.
create or replace function admin_send_notification(p_user_id uuid, p_title text, p_body text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  if p_title is null or trim(p_title) = '' then raise exception 'A title is required.'; end if;

  if p_user_id is null then
    insert into notifications (profile_id, kind, title, body)
    select id, 'admin', p_title, coalesce(p_body, '') from profiles;
    get diagnostics n = row_count;
  else
    insert into notifications (profile_id, kind, title, body)
    values (p_user_id, 'admin', p_title, coalesce(p_body, ''));
    n := 1;
  end if;
  return n;
end;
$$;

-- ---- 2. Enum-cast fix on admin balance / profit ----------------------------
create or replace function admin_set_balance(p_user_id uuid, p_amount numeric, p_label text default 'Balance adjusted')
returns void language plpgsql security definer set search_path = public as $$
declare v_old numeric; v_delta numeric;
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
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  if not exists (select 1 from profiles where id = p_user_id) then raise exception 'User not found.'; end if;
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
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  if not exists (select 1 from profiles where id = p_user_id) then raise exception 'User not found.'; end if;
  update profiles set profit = profit + p_amount, balance = balance + p_amount where id = p_user_id;
  insert into transactions (profile_id, type, label, amount)
  values (p_user_id, (case when p_amount >= 0 then 'credit' else 'debit' end)::tx_type, p_label, abs(p_amount));
end;
$$;

-- ---- 3. Suspension enforcement on funding ----------------------------------
create or replace function request_deposit(
  p_method funding_method, p_amount numeric, p_reference text default '', p_receipt_url text default null
)
returns funding_requests language plpgsql security definer set search_path = public as $$
declare v_min numeric; v_status account_status; v_row funding_requests;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select status into v_status from profiles where id = auth.uid();
  if v_status = 'suspended' then raise exception 'This account has been suspended. Please contact support.'; end if;
  if p_amount <= 0 then raise exception 'Enter an amount greater than $0.'; end if;

  select min_deposit into v_min from platform_settings where id = 1;
  if p_amount < coalesce(v_min, 0) then raise exception 'Minimum deposit is $%', v_min; end if;

  insert into funding_requests (profile_id, kind, method, amount, reference, receipt_url, status)
  values (auth.uid(), 'deposit', p_method, p_amount, p_reference, p_receipt_url, 'pending')
  returning * into v_row;
  return v_row;
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

  update profiles set balance = balance - p_amount where id = auth.uid();
  insert into transactions (profile_id, type, label, amount)
  values (auth.uid(), 'debit', 'Withdrawal requested - ' || p_method::text, p_amount);
  insert into funding_requests (profile_id, kind, method, amount, destination, status)
  values (auth.uid(), 'withdrawal', p_method, p_amount, p_destination, 'pending')
  returning * into v_row;
  return v_row;
end;
$$;

-- ---- 4. Auto-notifications on key events -----------------------------------
create or replace function admin_approve_request(p_request_id uuid, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare r funding_requests;
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  select * into r from funding_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request is not pending.'; end if;

  if r.kind = 'deposit' then
    update profiles set balance = balance + r.amount where id = r.profile_id;
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'credit', 'Deposit approved - ' || r.method::text, r.amount);
    perform notify(r.profile_id, 'deposit', 'Deposit approved',
      'Your deposit of $' || trim(to_char(r.amount, 'FM999999990.00')) || ' has been approved and credited.');
  else
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
    update profiles set balance = balance + r.amount where id = r.profile_id;
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

create or replace function admin_decide_kyc(p_user_id uuid, p_status kyc_status, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admin only.'; end if;
  update profiles set kyc_status = p_status, kyc_note = p_note where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;

  if p_status = 'verified' then
    perform notify(p_user_id, 'kyc', 'Identity verified', 'Your account is verified. Withdrawals are now enabled.');
  elsif p_status = 'rejected' then
    perform notify(p_user_id, 'kyc', 'Verification unsuccessful',
      coalesce(nullif(p_note, ''), 'Your documents could not be verified. Please submit again.'));
  end if;
end;
$$;

create or replace function send_message(p_profile_id uuid, p_from message_from, p_text text)
returns messages language plpgsql security definer set search_path = public as $$
declare v_row messages;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if trim(p_text) = '' then raise exception 'Write a message first.'; end if;

  if p_from = 'support' then
    if not is_admin() then raise exception 'Only support can send as support.'; end if;
  else
    if p_profile_id is distinct from auth.uid() then raise exception 'You can only message on your own behalf.'; end if;
  end if;

  insert into messages (profile_id, "from", text) values (p_profile_id, p_from, p_text) returning * into v_row;

  if p_from = 'support' then
    update profiles set unread_for_user = unread_for_user + 1 where id = p_profile_id;
    perform notify(p_profile_id, 'message', 'New message from support', p_text);
  else
    update profiles set unread_for_admin = unread_for_admin + 1 where id = p_profile_id;
  end if;

  return v_row;
end;
$$;
