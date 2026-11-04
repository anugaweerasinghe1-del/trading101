import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SITE_DOMAIN, STARTING_BALANCE_LABEL } from "@/lib/constants";
import { authUrl } from "@/lib/authRedirect";
import { takePendingPath } from "@/lib/pendingRedirect";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  username: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(20, "Keep it under 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, - and _ only")
    .optional(),
});

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">(() =>
    new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate(takePendingPath() ?? "/trader/me", { replace: true });
  }, [user, navigate]);

  // Surface expired / invalid email-link errors instead of a silent no-op.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const err = hash.get("error_description") || hash.get("error");
    if (err) {
      toast.error(decodeURIComponent(err.replace(/\+/g, " ")));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      email,
      password,
      username: mode === "signup" ? username : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: authUrl("/auth"),
            data: { username: parsed.data.username, is_public: false },
          },
        });
        if (error) throw error;
        setSent(true);
        toast.success("Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Signed in.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authUrl("/auth"),
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed. Try email instead.");
      setBusy(false);
    }
  };

  const forgot = async () => {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: authUrl("/reset-password"),
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent.");
  };

  const title = "Sign in or create a free TradeHQ account";
  // The signup form is reached directly from /auth?mode=signup; existing logins
  // never become attributed registrations just because a CTA was clicked.
  const description =
    "Optional free account for TradeHQ. Account cash, positions and server-recorded trades restore across devices when the service is available; journals remain browser-held while signed-in lessons and journey progress sync privately when online. Public profiles can use community features. Core learning tools remain usable without an account.";

  return (
    <>
      <Helmet>
        <title>{title} | TradeHQ</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_DOMAIN}/auth`} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-2xs uppercase tracking-widest text-primary mb-4">
              <Sparkles className="h-3 w-3" /> Optional — everything works signed out
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your free account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              An account adds optional community features such as the leaderboard, profile visibility and friend
              challenges. New profiles start private. You can choose to publish your profile later using a separate control on your profile page.
              Trading, courses and tools never require an account.
            </p>
          </div>

          <Card className="p-6 glass-tactile border-chrome">
            {sent ? (
              <div className="text-center py-6">
                <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-3" />
                <h2 className="font-semibold mb-1">Confirm your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <strong>{email}</strong>. Click it to
                  activate your account.
                </p>
              </div>
            ) : (
              <>
                <form onSubmit={submit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. anuga_trades"
                        maxLength={20}
                        autoComplete="username"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={busy} className="w-full !text-black font-bold">
                    {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {mode === "signin" ? "Sign in" : "Create account"}
                  </Button>
                </form>

                <div className="relative my-5 text-center">
                  <span className="relative z-10 bg-card px-3 text-2xs uppercase tracking-widest text-muted-foreground">
                    or
                  </span>
                  <span className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
                </div>

                <Button variant="outline" onClick={google} disabled={busy} className="w-full">
                  Continue with Google
                </Button>

                <div className="mt-5 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  >
                    {mode === "signin" ? "Create an account" : "I already have an account"}
                  </button>
                  {mode === "signin" && (
                    <button type="button" className="text-muted-foreground hover:underline" onClick={forgot}>
                      Forgot password?
                    </button>
                  )}
                </div>
              </>
            )}
          </Card>

          <p className="text-2xs text-muted-foreground mt-6 text-center leading-relaxed">
            If you create an account, we store authentication details, your chosen username and your simulated
            practice portfolio when sync is available. New profiles start private; you can opt in to public visibility later from your profile page. No real money, no brokerage links, no payment
            details. Every balance on TradeHQ is virtual and starts at{" "}
            {STARTING_BALANCE_LABEL}. (Educational simulation only — not financial
            advice.) See our{" "}
            <Link to="/privacy" className="underline">privacy policy</Link>.
          </p>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
