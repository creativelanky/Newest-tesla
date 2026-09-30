import { getSessionUser, unauthorized, ok } from '@/lib/supabase/guards';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim().toUpperCase();

  let query = supabaseAdmin()
    .from('parcel_trackings')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (code) query = query.eq('tracking_code', code);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return ok(data || []);
}
