import { useState } from "react";
import { useSearchParams, useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { supabase } from "@/integrations/supabase/client";

export default function NewsletterPage() {
  const [params] = useSearchParams();
  const pageLocation = useLocation();
  const token = params.get("token") || "";
  const confirm = pageLocation.pathname.endsWith("/confirm");
  const remove = pageLocation.pathname.endsWith("/unsubscribe");
  const special = confirm || remove;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const execute = async () => {
    if (busy || !/^[a-f0-9]{64}$/.test(token)) return;
    setBusy(true); setStatus("");
    try {
      const { data, error } = await supabase.functions.invoke("newsletter-public", {
        body: { action: confirm ? "confirm" : "unsubscribe", token },
      });
      if (error || data?.error) throw Error(data?.error || "Request unsuccessful");
      setStatus(data?.message || "Done.");
    } catch { setStatus("Unable to complete the request. Check your link or try again."); }
    finally { setBusy(false); }
  };
  return <>
    <Helmet>
      <title>{confirm ? "Confirm subscription" : remove ? "Unsubscribe" : "TradeHQ Weekly Newsletter"} | TradeHQ</title>
      <meta name="description" content="Original beginner-friendly weekly financial lessons, with email confirmation and an easy unsubscribe."/>
      <meta name="robots" content={special ? "noindex,nofollow" : "index,follow"}/>
      {!special && <link rel="canonical" href="https://www.thetradehq.com/newsletter"/>}
    </Helmet>
    <Navigation/>
    <main className="container mx-auto max-w-3xl px-4 pt-32 pb-20 min-h-[70vh]">
      {special ? <section className="rounded-2xl border border-border bg-card p-8 space-y-4">
        <h1 className="text-3xl font-semibold">
          {confirm ? "Confirm your TradeHQ Weekly subscription" : "Unsubscribe from TradeHQ Weekly"}
        </h1>
        <p className="text-muted-foreground">
          {confirm ? "Only your confirmation activates the free educational newsletter." :
            "You can stop receiving weekly emails immediately. No login required."}
        </p>
        {!status && <button type="button" disabled={busy || !/^[a-f0-9]{64}$/.test(token)}
          onClick={execute} className="rounded-xl bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50">
          {busy ? "Processing…" : confirm ? "Confirm my subscription" : "Unsubscribe"}
        </button>}
        {!token && <p className="text-sm text-destructive">Your link is missing a valid token.</p>}
        {status && <p role="status" className="text-foreground">{status}</p>}
        <Link to="/" className="block text-primary underline text-sm">Return to TradeHQ</Link>
      </section> : <>
        <h1 className="text-4xl font-semibold mb-5">TradeHQ Weekly</h1>
        <p className="text-muted-foreground mb-8">One genuinely useful financial-literacy lesson every week. Written for beginners. Each issue stands alone, without visiting the site.</p>
        <NewsletterSignup prominent/>
      </>}
    </main>
    <MegaFooter/>
  </>;
}
