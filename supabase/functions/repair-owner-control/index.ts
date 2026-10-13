import { createClient } from 'npm:@supabase/supabase-js@2';
import { createRepairOwnerControl } from '../_shared/repairOwnerControl.ts';
import { allow } from '../_shared/rateLimit.ts';

const server = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false }, global: {
    fetch: (input, init) => fetch(input, { ...init, redirect: 'error', signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000) }),
  } });
async function control(functionName: 'tradehq_repair_owner_status' | 'tradehq_repair_owner_stop', ownerId: string) {
  const { data, error } = await server.rpc(functionName, { p_owner: ownerId });
  if (error) throw Error('CONTROL_DATABASE');
  return data;
}
Deno.serve(createRepairOwnerControl({
  getMode: () => Deno.env.get('TRADEHQ_REPAIR_CONTROL_MODE'),
  getOwnerId: () => Deno.env.get('TRADEHQ_REPAIR_OWNER_ID'),
  getAdminKey: () => Deno.env.get('ADMIN_MASTER_KEY'),
  getUser: token => server.auth.getUser(token),
  status: ownerId => control('tradehq_repair_owner_status', ownerId),
  stop: ownerId => control('tradehq_repair_owner_stop', ownerId),
  allowStatus: ownerId => allow(ownerId, 'repair-owner-status', 60, 20),
}));
