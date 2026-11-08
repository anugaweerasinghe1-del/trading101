import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { trophyDeniedStatus } from "@/lib/trophyFunctionErrors";

export interface VerifiedTrophy {
  id: string; progress: number; target: number; earned: boolean; issuedAt: string | null;
}
export interface TrophyState {
  status: "available"; entries: VerifiedTrophy[];
  share: { enabled: boolean; flair: string | null; pins: string[] };
  profilePublic: boolean;
}
export type ScoredChallenge = {
  id: string; title: string; detail: string; category: string; attemptId: string;
  questions: Array<{ prompt: string; options: string[] }>;
};
export const trophyEvidenceKey = (userId: string | null) => ["server-trophy-evidence", userId] as const;
export async function trophyRequest<T>(token: string, input: Record<string,unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("trophy-evidence", {
    body: input,
    headers: { Authorization: "Bearer " + token },
  });
  if (error) {
    const denied = await trophyDeniedStatus(error);
    if (denied) return { status: denied } as T;
    throw new Error("Trophy verification is temporarily unavailable.");
  }
  if (!data) throw new Error("Trophy verification is temporarily unavailable.");
  return data;
}
export function useVerifiedTrophyState() {
  const { user, session, loading } = useAuth();
  const id = user?.id ?? null;
  const token = session?.user.id === id ? session.access_token : null;
  const query = useQuery({
    queryKey: trophyEvidenceKey(id),
    enabled: !loading && Boolean(id && token),
    queryFn: async () => {
      const result = await trophyRequest<TrophyState | {status:string}>(token!, { action: "state" });
      if (result.status !== "available" || !("entries" in result) || !Array.isArray(result.entries)
          || result.entries.length !== 20 || !("share" in result) || !result.share
          || !("profilePublic" in result) || typeof result.profilePublic !== "boolean") {
        throw Error("Trophy evidence unavailable.");
      }
      const payload = result as TrophyState;
      if (typeof payload.share.enabled !== "boolean" || !Array.isArray(payload.share.pins)
          || payload.entries.some(entry => typeof entry.id !== "string" ||
            typeof entry.earned !== "boolean" || typeof entry.progress !== "number")) {
        throw Error("Trophy evidence unavailable.");
      }
      return payload;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  return { id, token, authLoading: loading, query };
}
