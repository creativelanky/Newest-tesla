import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

// Sets the two source figures together. The database calculates balance from
// them, preventing total balance, deposits, and profit from drifting apart.
export async function POST(req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { depositTotal, profit } = await req.json();
  const deposits = Number(depositTotal);
  const profitAmount = Number(profit);
  if (!Number.isFinite(deposits) || !Number.isFinite(profitAmount)) {
    return badRequest('Enter valid deposit and profit figures.');
  }

  const { error } = await supabaseServer().rpc('admin_set_account_figures', {
    p_user_id: params.id,
    p_deposit_total: deposits,
    p_profit: profitAmount,
  });

  if (error) return badRequest(error.message);
  return ok({ updated: true, balance: deposits + profitAmount });
}
