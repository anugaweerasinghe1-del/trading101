import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";

const titles = {
  "first-course": "First Course Certificate",
  "core-studies": "Core Studies Certificate",
  foundations: "Foundations Completion Certificate",
};

type Result = { status: "loading" | "invalid" | "unavailable" }
  | { status: "verified"; title: string; issuedOn: string };

export default function CertificateVerification() {
  const { hash } = useLocation();
  return <VerificationResult key={hash} token={hash.slice(1)} />;
}

function VerificationResult({ token }: { token: string }) {
  const [result, setResult] = useState<Result>({ status: "loading" });

  useEffect(() => {
    if (!/^[a-f0-9]{64}$/.test(token)) {
      setResult({ status: "invalid" });
      return;
    }

    const abort = new AbortController();
    setResult({ status: "loading" });
    void (async () => {
      try {
        const response = await fetch(SUPABASE_URL + "/functions/v1/foundations-certificate-verify", {
          method: "POST",
          signal: abort.signal,
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) {
          if (!abort.signal.aborted) setResult({ status: response.status === 404 ? "invalid" : "unavailable" });
          return;
        }
        const proof = await response.json();
        if (abort.signal.aborted) return;
        const title = Object.prototype.hasOwnProperty.call(titles, proof?.milestone)
          ? titles[proof.milestone as keyof typeof titles] : undefined;
        setResult(proof?.status === "verified" && proof.programmeVersion === "foundations-v1"
          && title && typeof proof.issuedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(proof.issuedOn)
          ? { status: "verified", title, issuedOn: proof.issuedOn }
          : { status: "unavailable" });
      } catch {
        if (!abort.signal.aborted) setResult({ status: "unavailable" });
      }
    })();
    return () => abort.abort();
  }, [token]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Helmet>
        <title>Certificate verification | The Trade HQ</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <p className="text-sm font-semibold text-muted-foreground">The Trade HQ</p>
      <h1 className="mt-2 text-3xl font-bold">Certificate verification</h1>
      <div className="my-6 space-y-2 rounded-xl border p-5" role="status">
        {result.status === "loading" && <p>Checking the verification link…</p>}
        {result.status === "invalid" && <p>This verification link is invalid or has been withdrawn.</p>}
        {result.status === "unavailable" && <p>Verification is temporarily unavailable. Try again shortly.</p>}
        {result.status === "verified" && <>
          <h2 className="font-semibold">Certificate verified</h2>
          <p>{result.title}</p>
          <p>Foundations programme v1</p>
          <p>Issued <time dateTime={result.issuedOn}>{result.issuedOn}</time></p>
          <p className="text-sm text-muted-foreground">The recipient’s details are private.</p>
        </>}
      </div>
      <Link to="/" className="text-sm text-primary underline underline-offset-4">Visit The Trade HQ</Link>
    </main>
  );
}
