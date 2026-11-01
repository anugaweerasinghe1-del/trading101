import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getIP(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") ?? "";
  const ip = xf.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return ip;
}

async function hashIP(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, content, rating } = await req.json();

    // Validate
    const cleanContent = typeof content === "string" ? content.trim() : "";
    const cleanName = typeof name === "string" ? name.trim().slice(0, 60) : "";
    const r = Number(rating);
    if (!cleanContent || cleanContent.length < 5 || cleanContent.length > 1000) {
      return new Response(JSON.stringify({ error: "Review must be 5–1000 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return new Response(JSON.stringify({ error: "Rating must be 1–5" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const salt = Deno.env.get("ADMIN_MASTER_KEY") ?? serviceKey;
    const ip = getIP(req);
    const ip_hash = await hashIP(ip, salt);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey,
    );

    const { error } = await supabase.from("reviews").insert({
      name: cleanName || null,
      content: cleanContent,
      rating: r,
      ip_hash,
      is_visible: false,
    });

    if (error) {
      if (error.code === "23505") {
        return new Response(JSON.stringify({ error: "You've already submitted a review. Thank you!" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    return new Response(JSON.stringify({ ok: true, status: "pending_moderation" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});