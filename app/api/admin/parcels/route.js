import { badRequest, forbidden, getAdminUser, ok } from '@/lib/supabase/guards';
import { supabaseAdmin } from '@/lib/supabase/server';

const STATUSES = new Set(['processing', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'on_hold', 'cancelled']);

function makeTrackingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 8; i += 1) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `SPX-${new Date().getFullYear()}-${suffix}`;
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { data, error } = await supabaseAdmin()
    .from('parcel_trackings')
    .select('*, profiles(name, email)')
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return ok(data || []);
}

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const body = await request.json();
  const profileId = String(body.profileId || '');
  const status = STATUSES.has(body.status) ? body.status : 'processing';
  if (!profileId) return badRequest('Select a user first.');

  const event = {
    status,
    location: String(body.currentLocation || ''),
    note: String(body.note || 'Tracking code generated.'),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin()
    .from('parcel_trackings')
    .insert({
      profile_id: profileId,
      tracking_code: makeTrackingCode(),
      title: body.title || 'Investment parcel',
      origin: body.origin || '',
      destination: body.destination || '',
      carrier: body.carrier || '',
      status,
      current_location: body.currentLocation || '',
      estimated_delivery: body.estimatedDelivery || null,
      note: body.note || '',
      history: [event],
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return ok(data);
}
