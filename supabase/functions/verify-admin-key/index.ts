import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { allow, clientIp } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ valid: false, error: 'Method not allowed' }, 405);
  try {
    // Protect even wrong-key requests; a spoofed forwarded IP cannot evade
    // the shared global budget. Rate-limit errors fail closed.
    if (!await allow('verify-admin-key-global', 'verify-admin-key-global', 60, 120)
      || !await allow('verify-admin-key:' + clientIp(req), 'verify-admin-key-ip', 60, 20))
      return reply({ valid: false, error: 'Too many attempts' }, 429);
  } catch {
    return reply({ valid: false, error: 'Verification temporarily unavailable' }, 503);
  }
  try {
    const raw = await req.text();
    if (raw.length > 2048) return reply({ valid: false, error: 'Request too large' }, 413);
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.key !== 'string')
      return reply({ valid: false, error: 'Invalid request' }, 400);
    const master = Deno.env.get('ADMIN_MASTER_KEY');
    if (!master) return reply({ valid: false, error: 'Verification unavailable' }, 503);
    const supplied: string = data.key;
    if (supplied.length !== master.length) return reply({ valid: false }, 401);
    let mismatch = 0;
    for (let i = 0; i < master.length; i++) mismatch |= master.charCodeAt(i) ^ supplied.charCodeAt(i);
    return reply({ valid: mismatch === 0 }, mismatch === 0 ? 200 : 401);
  } catch {
    return reply({ valid: false, error: 'Invalid request' }, 400);
  }
});
