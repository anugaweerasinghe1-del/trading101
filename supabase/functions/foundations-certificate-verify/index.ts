import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { createFoundationsVerificationHandler } from "../_shared/foundationsCertificateHandler.ts";
import { allow, clientIp } from "../_shared/rateLimit.ts";

const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(createFoundationsVerificationHandler({
  admit: request => allow(clientIp(request), "foundations-certificate-verify", 60, 30),
  async lookup(tokenHash) {
    const { data, error } = await client.rpc("verify_foundations_certificate", { p_token_hash: tokenHash }).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as { programme_version: string; milestone: string; issued_on: string };
    return { programmeVersion: row.programme_version, milestone: row.milestone, issuedOn: row.issued_on };
  },
}));
