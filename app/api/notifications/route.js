import { getSessionUser, unauthorized, ok } from '@/lib/supabase/guards';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { data, error } = await supabaseAdmin()
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Table may not exist yet (migration-02 not run) — degrade to empty.
  if (error) return ok({ items: [], unread: 0 });

  const items = data || [];
  return ok({ items, unread: items.filter((n) => !n.read).length });
}
