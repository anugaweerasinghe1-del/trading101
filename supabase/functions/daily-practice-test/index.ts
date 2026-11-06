import { createClient } from 'npm:@supabase/supabase-js@2.75.1';
import { createDailyProbeHandler } from '../_shared/dailyPracticeProbe.ts';
import { verifyCoursePublicationOwner } from '../_shared/coursePublicationGate.ts';
import { allow, clientIp } from '../_shared/rateLimit.ts';
const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
Deno.serve(createDailyProbeHandler({
  getKey: () => Deno.env.get('ADMIN_MASTER_KEY'),
  authLimit: async request => await allow('daily-probe-auth-global', 'daily-probe-auth-global', 60, 60)
    && await allow('daily-probe-auth:' + clientIp(request), 'daily-probe-auth-ip', 300, 20),
  owner: async request => {
    const { data: owner, error } = await client.rpc('tradehq_repair_registered_owner');
    if (error || typeof owner !== 'string') return false;
    return verifyCoursePublicationOwner(request, owner, async jwt => {
      const { data, error } = await client.auth.getUser(jwt);
      return error ? null : data.user?.id ?? null;
    });
  },
  config: async () => {
    const { data, error } = await client.rpc('newsletter_ai_credentials');
    if (error) throw Error('Configuration unavailable');
    return data;
  },
  admit: () => allow('daily-practice-test-global', 'daily-practice-test-one-per-utc-day-v1', 86400, 1),
}));
