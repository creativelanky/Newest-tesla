import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { note } = await req.json().catch(() => ({}));
  const { error } = await supabaseServer().rpc('admin_approve_request', {
    p_request_id: params.id,
    p_note: note || '',
  });

  if (error) return badRequest(error.message);
  return ok({ approved: true });
}
