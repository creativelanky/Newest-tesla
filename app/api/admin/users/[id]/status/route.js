import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { status, reason } = await req.json();
  const { error } = await supabaseServer().rpc('admin_set_status', {
    p_user_id: params.id,
    p_status: status,
    p_reason: reason ?? null,
  });

  if (error) return badRequest(error.message);
  return ok({ updated: true });
}
