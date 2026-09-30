import { getSessionUser, unauthorized, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { method, amount, destination } = await req.json();
  if (!method || !(Number(amount) > 0)) return badRequest('Enter a method and amount.');

  const { data, error } = await supabaseServer().rpc('request_withdrawal', {
    p_method: method,
    p_amount: amount,
    p_destination: destination || {},
  });

  if (error) return badRequest(error.message);
  return ok(data);
}
