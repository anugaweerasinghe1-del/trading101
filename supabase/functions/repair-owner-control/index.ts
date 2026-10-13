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
  // Explicit owner-stop-only code mode. Missing approved SQL/owner binding denies
  // operation; no additional secret or browser-selected UUID can enable it.
  getMode: () => 'owner-stop-only-v1',
  getOwnerId: async () => {
    const { data, error } = await server.rpc('tradehq_repair_registered_owner');
    if (error || typeof data !== 'string') throw Error('CONTROL_REGISTRATION');
    return data;
  },
  getAdminKey: () => Deno.env.get('ADMIN_MASTER_KEY'),
  getUser: token => server.auth.getUser(token),
  status: ownerId => control('tradehq_repair_owner_status', ownerId),
  stop: ownerId => control('tradehq_repair_owner_stop', ownerId),
  allowStatus: ownerId => allow(ownerId, 'repair-owner-status', 60, 20),
}));
