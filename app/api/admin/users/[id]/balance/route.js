import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

// body: { mode: 'set' | 'adjust', amount, label? }
export async function POST(req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { mode, amount, label } = await req.json();
  const fn = mode === 'adjust' ? 'admin_adjust_balance' : 'admin_set_balance';
  const arg = mode === 'adjust' ? { p_delta: amount } : { p_amount: amount };

  const { error } = await supabaseServer().rpc(fn, {
    p_user_id: params.id,
    ...arg,
    ...(label ? { p_label: label } : {}),
  });

  if (error) return badRequest(error.message);
  return ok({ updated: true });
}
