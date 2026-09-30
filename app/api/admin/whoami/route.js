import { getAdminUser, ok } from '@/lib/supabase/guards';

export async function GET() {
  const admin = await getAdminUser();
  return ok({ isAdmin: !!admin });
}
