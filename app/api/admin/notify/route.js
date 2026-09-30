import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

// body: { userId?: string|null, title, body }.  Null/omitted userId broadcasts.
export async function POST(req) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { userId, title, body } = await req.json();
  if (!title?.trim()) return badRequest('A title is required.');

  const { data, error } = await supabaseServer().rpc('admin_send_notification', {
    p_user_id: userId || null,
    p_title: title,
    p_body: body || '',
  });

  if (error) return badRequest(error.message);
  return ok({ sent: data });
}
