import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_DOMAIN } from "@/lib/constants";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const navigate = useNavigate();

  // The recovery link creates a temporary session. Without it we cannot
  // update the password, so show a clear "link expired" state instead.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error")) {
      setReady("invalid");
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady("ok");
    });
    supabase.auth.getSession().then(({ data }) => {
      setReady(data.session ? "ok" : "invalid");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().min(8, "Use at least 8 characters").max(72).safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate("/trader/me", { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Reset your password | TradeHQ</title>
        <meta name="description" content="Set a new password for your free TradeHQ practice account." />
        <link rel="canonical" href={`${SITE_DOMAIN}/reset-password`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-md">
          <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Set a new password</h1>
          <Card className="p-6 glass-tactile border-chrome">
            {ready === "checking" && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Checking your reset link…
              </p>
            )}
            {ready === "invalid" && (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  This password reset link is invalid or has expired. Request a new
                  one from the sign-in page.
                </p>
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Back to sign in
                </Button>
              </div>
            )}
            {ready === "ok" && (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full !text-black font-bold">
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update password
              </Button>
            </form>
            )}
          </Card>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}