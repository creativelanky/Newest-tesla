import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

const METHODS = new Set(['bitcoin', 'paypal', 'bank']);

// Records a deposit that was verified outside the user-facing submission flow.
// It is created as approved so it appears in both funding and ledger history.
export async function POST(req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { amount, method, reference } = await req.json();
  const depositAmount = Number(amount);
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return badRequest('Enter a deposit amount greater than $0.');
  }
  if (!METHODS.has(method)) return badRequest('Choose a valid payment method.');

  const { data, error } = await supabaseServer().rpc('admin_create_deposit', {
    p_user_id: params.id,
    p_amount: depositAmount,
    p_method: method,
    p_reference: String(reference || '').trim(),
  });

  if (error) return badRequest(error.message);
  return ok(data);
}
