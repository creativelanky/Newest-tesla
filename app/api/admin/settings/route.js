import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const patch = await req.json();
  const { data, error } = await supabaseServer().rpc('admin_save_settings', { p_patch: patch });

  if (error) return badRequest(error.message);
  return ok(data);
}
