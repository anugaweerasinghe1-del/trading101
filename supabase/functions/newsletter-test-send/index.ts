// Retired owner-only test sender. Public TradeHQ Weekly uses newsletter-public
// and the separately authenticated newsletter-dispatch service instead.
// Historical test receipts remain intact; this endpoint cannot send an email.
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,x-admin-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers});
  return new Response(JSON.stringify({
    error:"The old send-to-my-inbox test endpoint has been retired. Use TradeHQ Weekly subscriptions and confirmed-recipient publishing."
  }),{status:410,headers});
});
