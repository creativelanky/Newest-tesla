import { NextResponse } from 'next/server';
import { supabaseServer, supabaseAdmin } from './server';

const ADMIN_EMAILS = new Set(['support@endlesspeakinvestment.xyz']);

// Resolves the authenticated caller from request cookies. Returns null if
// there's no valid session — callers should respond 401.
export async function getSessionUser() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

// Same, but additionally verifies (via the service-role client, so RLS can't
// mask the check) that the caller's profile has role = 'admin'.
export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user) return null;
  if (ADMIN_EMAILS.has(user.email?.toLowerCase())) return user;
  const { data: profile } = await supabaseAdmin()
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export function unauthorized(message = 'Sign in required.') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Admins only.') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function ok(data) {
  return NextResponse.json({ data });
}
