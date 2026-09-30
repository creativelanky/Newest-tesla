import { badRequest, forbidden, getAdminUser, ok } from '@/lib/supabase/guards';
import { supabaseAdmin } from '@/lib/supabase/server';

const STATUSES = new Set(['processing', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'on_hold', 'cancelled']);

export async function POST(request, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const body = await request.json();
  const status = STATUSES.has(body.status) ? body.status : null;
  if (!status) return badRequest('Invalid parcel status.');

  const db = supabaseAdmin();
  const { data: current, error: readError } = await db
    .from('parcel_trackings')
    .select('history')
    .eq('id', params.id)
    .single();

  if (readError) return Response.json({ error: readError.message }, { status: 400 });

  const event = {
    status,
    location: String(body.currentLocation || ''),
    note: String(body.note || ''),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('parcel_trackings')
    .update({
      status,
      current_location: body.currentLocation || '',
      estimated_delivery: body.estimatedDelivery || null,
      note: body.note || '',
      history: [...(Array.isArray(current?.history) ? current.history : []), event],
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return ok(data);
}
