import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { error } = await supabaseServer().rpc('admin_revert_request', {
    p_request_id: params.id,
  });

  if (error) return badRequest(error.message);
  return ok({ reverted: true });
}
