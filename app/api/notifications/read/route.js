import { getSessionUser, unauthorized, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { error } = await supabaseServer().rpc('mark_notifications_read');
  if (error) return ok({ cleared: false });
  return ok({ cleared: true });
}
