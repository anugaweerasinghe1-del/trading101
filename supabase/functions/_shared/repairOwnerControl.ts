/** Server-only owner status/stop boundary. No resume, proposal, approval or release action. */
type Principal = { id?: string; aud?: string; is_anonymous?: boolean; email_confirmed_at?: string };
type ControlState = { stopped: boolean; generation: number; activeCandidates: number };
type Options = {
  getMode: () => string | undefined;
  getOwnerId: () => string | undefined | Promise<string | undefined>;
  getAdminKey: () => string | undefined;
  getUser: (token: string) => Promise<{ data?: { user?: Principal | null }; error?: unknown }>;
  status: (ownerId: string) => Promise<unknown>;
  stop: (ownerId: string) => Promise<unknown>;
  allowStatus: (ownerId: string) => Promise<boolean>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const authorization = Object.freeze({ codeWrites: false, modelCalls: false, merge: false, productionRelease: false });
function equalKey(a: string | undefined, b: string | null) {
  if (!a || !b || a.length < 24 || a.length > 4096 || a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
async function readAction(req: Request): Promise<'status' | 'stop'> {
  const reader = req.body?.getReader();
  if (!reader) throw Error('BODY');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const read = async () => {
      const chunks: Uint8Array[] = []; let size = 0;
      for (;;) {
        const part = await reader.read(); if (part.done) break;
        size += part.value.byteLength; if (size > 128) throw Error('SIZE'); chunks.push(part.value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      if (!body || Array.isArray(body) || Object.keys(body).length !== 1 || !['status', 'stop'].includes(body.action)) throw Error('ACTION');
      return body.action as 'status' | 'stop';
    };
    return await Promise.race([read(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('TIME')), 5000); })]);
  } finally { clearTimeout(timer); void reader.cancel().catch(() => {}); }
}
function controlState(value: unknown): ControlState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('STATE');
  const state = value as Record<string, unknown>;
  if (Object.keys(state).sort().join('|') !== 'activeCandidates|generation|stopped'
    || typeof state.stopped !== 'boolean' || !Number.isSafeInteger(state.generation) || Number(state.generation) < 0
    || !Number.isSafeInteger(state.activeCandidates) || Number(state.activeCandidates) < 0 || Number(state.activeCandidates) > 1) throw Error('STATE');
  return state as ControlState;
}
export function createRepairOwnerControl(options: Options) {
  const headers = {
    'Access-Control-Allow-Origin': 'https://www.thetradehq.com',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-admin-key, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
  };
  const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return response({ code: 'METHOD' }, 405);
    try {
      if (options.getMode() !== 'owner-stop-only-v1' || !options.getAdminKey()) return response({ code: 'CONTROL_PAUSED' }, 503);
      // Invalid master keys never reach Supabase Auth or the database.
      if (!equalKey(options.getAdminKey(), req.headers.get('x-admin-key'))) return response({ code: 'OWNER_REQUIRED' }, 401);
      const ownerId = await options.getOwnerId();
      if (!uuid.test(ownerId ?? '')) return response({ code: 'CONTROL_PAUSED' }, 503);
      const bearer = req.headers.get('authorization');
      if (!bearer?.startsWith('Bearer ') || bearer.length < 23 || bearer.length > 8200) return response({ code: 'OWNER_REQUIRED' }, 401);
      let action: 'status' | 'stop';
      try { action = await readAction(req); } catch { return response({ code: 'INVALID_ACTION' }, 400); }
      // The runtime wires this to supabase.auth.getUser(token), never getSession/JWT parsing.
      const session = await options.getUser(bearer.slice(7)); const user = session.data?.user;
      if (session.error || user?.id !== ownerId || user?.aud !== 'authenticated' || user.is_anonymous === true || !user.email_confirmed_at) return response({ code: 'OWNER_REQUIRED' }, 401);
      // Emergency stop deliberately does not depend on the status rate limiter.
      if (action === 'status' && !await options.allowStatus(ownerId!)) return response({ code: 'STATUS_LIMIT' }, 429);
      const state = controlState(await (action === 'stop' ? options.stop(ownerId!) : options.status(ownerId!)));
      if (action === 'stop' && (state.stopped !== true || state.activeCandidates !== 0)) throw Error('STOP_NOT_ACKNOWLEDGED');
      return response({ code: action === 'stop' ? 'DURABLE_STOP_CONFIRMED' : 'CONTROL_STATUS', ...state,
        mode: 'OWNER_STOP_ONLY', authorization });
    } catch {
      // A lost stop response cannot be reported as a successful stop. The owner may
      // retry this idempotent stop or inspect status; no resume/reset is available.
      return response({ code: 'CONTROL_UNAVAILABLE', stopConfirmed: false }, 503);
    }
  };
}
