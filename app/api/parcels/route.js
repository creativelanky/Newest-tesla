import { getSessionUser, ok } from '@/lib/supabase/guards';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim().toUpperCase();
  const db = supabaseAdmin();

  if (code) {
    const { data, error } = await db
      .from('parcel_trackings')
      .select('*')
      .eq('tracking_code', code)
      .maybeSingle();

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return ok(data ? [data] : []);
  }

  const user = await getSessionUser();
  if (!user) return ok([]);

  const { data, error } = await db
    .from('parcel_trackings')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return ok(data || []);
}
