import { getSessionUser, unauthorized, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

// Any signed-in user can read platform settings (needed to show deposit
// payment details) — RLS's "settings_select_all" policy enforces this too.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { data, error } = await supabaseServer().from('platform_settings').select('*').eq('id', 1).single();
  if (error) return unauthorized('Could not load settings.');
  return ok(data);
}
