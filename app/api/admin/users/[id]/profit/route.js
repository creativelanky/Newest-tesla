import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

// body: { mode: 'set' | 'add', amount, label? }
export async function POST(req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { mode, amount, label } = await req.json();
  const fn = mode === 'add' ? 'admin_add_profit' : 'admin_set_profit';
  const arg =
    mode === 'add'
      ? { p_amount: amount, ...(label ? { p_label: label } : {}) }
      : { p_amount: amount };

  const { error } = await supabaseServer().rpc(fn, { p_user_id: params.id, ...arg });
  if (error) return badRequest(error.message);
  return ok({ updated: true });
}
