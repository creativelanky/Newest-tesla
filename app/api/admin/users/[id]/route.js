import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseAdmin } from '@/lib/supabase/server';

// DELETE: permanently remove a user (Auth + all app data, via the Admin API
// so Auth's internal tables are cleaned up correctly — not a raw SQL delete).
export async function DELETE(_req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { error } = await supabaseAdmin().auth.admin.deleteUser(params.id);
  if (error) return badRequest(error.message);
  return ok({ deleted: true });
}
