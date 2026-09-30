-- ============================================================================
-- migration-04  —  run once in the Supabase SQL Editor.
-- Lets an admin revert a decided funding request (approved/rejected) back to
-- pending, reversing whatever balance effect the prior decision had so the
-- account returns to the state a pending request represents.
--
-- Money model recap:
--   deposit  approved  -> balance was credited (+amount)  => undo: -amount
--   deposit  rejected  -> nothing moved                   => no change
--   withdraw approved  -> funds already held at request   => no change
--   withdraw rejected  -> funds were refunded (+amount)   => re-hold: -amount
-- ============================================================================

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
    update profiles set balance = greatest(0, balance - r.amount) where id = r.profile_id;
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'debit', 'Deposit reopened (reverted to pending) - ' || r.method::text, r.amount);
  elsif r.kind = 'withdrawal' and r.status = 'rejected' then
    update profiles set balance = greatest(0, balance - r.amount) where id = r.profile_id;
    insert into transactions (profile_id, type, label, amount)
    values (r.profile_id, 'debit', 'Withdrawal re-held (reverted to pending) - ' || r.method::text, r.amount);
  end if;
  -- deposit+rejected and withdrawal+approved need no balance change.

  update funding_requests set status = 'pending', decided_at = null, note = '' where id = p_request_id;

  perform notify(
    r.profile_id, r.kind, 'Request reopened',
    'Your ' || r.kind || ' of $' || trim(to_char(r.amount, 'FM999999990.00')) || ' is under review again.'
  );
end;
$$;
