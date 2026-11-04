import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { startCloudSync } from "@/lib/cloudPortfolio";
import { activatePortfolioOwner } from "@/lib/portfolioOwner";
import { recordConsentedLeaderboardRegistration, LEADERBOARD_FUNNEL_READY_EVENT } from "@/lib/leaderboardFunnelTelemetry";

export interface Profile {
  id: string;
  username: string;
  country: string | null;
  bio: string | null;
  is_public: boolean;
  show_public_trades: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const authGeneration = useRef(0);
  const currentUserId = useRef<string | null>(null);

  const loadProfile = useCallback(async (uid: string, generation = authGeneration.current) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, country, bio, is_public, show_public_trades")
      .eq("id", uid)
      .maybeSingle();
    if (generation === authGeneration.current && currentUserId.current === uid) setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    const invalidatePendingWork = () => { ++authGeneration.current; };
    const applySession = (s: Session | null) => {
      const generation = ++authGeneration.current;
      const uid = s?.user.id ?? null;
      try { activatePortfolioOwner(uid); }
      catch { window.dispatchEvent(new Event('tradehq:portfolio-storage-warning')); }
      if (currentUserId.current !== uid) setProfile(null);
      currentUserId.current = uid;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Defer network work outside the auth callback to avoid blocking auth state propagation.
        setTimeout(() => {
          if (generation !== authGeneration.current || currentUserId.current !== s.user.id) return;
          void Promise.allSettled([
            loadProfile(s.user.id, generation),
            startCloudSync(s.user.id),
          ]);
        }, 0);
      } else {
        setProfile(null);
        void startCloudSync(null);
      }
      setLoading(false);
    };
    const initialGeneration = authGeneration.current;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => applySession(s));

    supabase.auth.getSession().then(({ data }) => {
      if (authGeneration.current === initialGeneration) applySession(data.session);
    }).catch(() => { if (authGeneration.current === initialGeneration) setLoading(false); });

    return () => { invalidatePendingWork(); sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  // An actual, newly-created Supabase account can complete an opt-in,
  // same-browser leaderboard funnel after OAuth or email verification.
  // This is deliberately a site-wide auth effect: an immediate route redirect
  // must not drop the conversion event or cause a second registration count.
  useEffect(() => {
    if (!user?.created_at) return;
    const record = () => { recordConsentedLeaderboardRegistration(user.created_at); };
    record();
    window.addEventListener(LEADERBOARD_FUNNEL_READY_EVENT, record);
    return () => window.removeEventListener(LEADERBOARD_FUNNEL_READY_EVENT, record);
  }, [user?.id, user?.created_at]);

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
