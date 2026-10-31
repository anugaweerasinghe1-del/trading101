import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { allow, clientIp } from "../_shared/rateLimit.ts";

// Editorial-only AI draft generator. NEVER sends emails or reads subscribers.
// Requires independently deployed SQL, Edge function, provider key and scheduler secret.
const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key, x-newsletter-scheduler",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });

const sources = [
  { title: "What Is Paper Trading?", path: "/learn/article/what-is-paper-trading", summary: "Simulated market orders, virtual balances, and limits of practice results" },
  { title: "How to Read a Stock Chart", path: "/learn/article/how-to-read-stock-charts", summary: "Candlesticks, time intervals, and why patterns don't predict certain outcomes" },
  { title: "Risk Management for Paper Trading", path: "/learn/article/risk-management-in-trading", summary: "Risk budgets, examples with fees, and why planned stop prices aren't guaranteed fills" },
  { title: "Market Orders vs Limit Orders", path: "/learn/article/market-orders-vs-limit-orders", summary: "TradeHQ simulates market orders; limit orders are covered as worksheets only" },
  { title: "Stock Market Indexes and ETFs", path: "/learn/article/stock-market-index-etfs", summary: "Index calculations, ETF objectives, fees and overlapping holdings" },
  { title: "How to Build a Virtual Portfolio", path: "/learn/article/how-to-build-a-portfolio", summary: "Hypothetical allocation, diversification limits and rebalancing costs" },
  { title: "Crypto vs Stocks", path: "/learn/article/crypto-vs-stocks", summary: "Differences between stock ownership and cryptocurrency exposures" },
  { title: "Trading Strategies to Study", path: "/learn/article/trading-strategies-for-beginners", summary: "Strategies as hypotheses rather than guaranteed ways to earn" },
  { title: "Technical Indicators: RSI, MACD and Moving Averages", path: "/learn/article/technical-indicators-rsi-macd-moving-averages", summary: "What indicators calculate, and why crossovers aren't recommendations" },
] as const;

type Draft = {
  id: string; week_of: string; status: string; revision: number;
  subject: string; preheader: string; body_markdown: string;
  reviewed_by: string | null; reviewed_at: string | null; updated_at: string;
  generator_error: string | null; ai_model: string | null;
};
function equalSecret(expected: string | undefined, value: string | null) {
  if (!expected || !value || expected.length !== value.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ value.charCodeAt(i);
  return mismatch === 0;
}
function thisMondayColombo(now = new Date()): string {
  const local = new Date(now.getTime() + 330 * 60_000);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const day = local.getUTCDay(); // Sun 0, Mon 1
  return new Date(midnight - ((day + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
}
function validateDraft(subject: unknown, preheader: unknown, body: unknown): boolean {
  if (typeof subject !== "string" || subject.trim().length < 8 || subject.length > 140) return false;
  if (typeof preheader !== "string" || preheader.trim().length < 10 || preheader.length > 240) return false;
  if (typeof body !== "string" || body.trim().length < 250 || body.length > 7000) return false;
  // Every link must lead to a vetted, actually published TradeHQ page.
  const links = [...body.matchAll(/https?:\/\/[^\s)>\]]+/g)].map(m => m[0].replace(/[.,;]$/, ""));
  const approved = new Set(sources.map(s => "https://www.thetradehq.com" + s.path));
  if (links.length < 1 || links.length > 4 || links.some(link => !approved.has(link))) return false;
  if (/guarantee(?:d|s)?\s+(returns?|profit)|real[- ]time\s+(market|price|data)|licensed\s+(financial|adviser)/i.test(subject + " " + body)) return false;
  return true;
}
async function generate(week: string) {
  const { data: existing, error: readError } = await client
    .from("newsletter_editions").select("id,status,revision").eq("week_of", week).maybeSingle();
  if (readError) throw Error("Draft database unavailable");
  if (existing && existing.status !== "failed") return { weekOf: week, status: existing.status, created: false };
  let id = existing?.id as string | undefined;
  if (!id) {
    // Unique week_of prevents duplicate cron/admin edition creation.
    const { data, error } = await client.from("newsletter_editions")
      .insert({ week_of: week, status: "generating" })
      .select("id").single();
    if (error) {
      if (error.code === "23505") return { weekOf: week, created: false, status: "already-exists" };
      throw Error("Could not reserve draft week");
    }
    id = data.id as string;
  } else {
    const { data, error } = await client.from("newsletter_editions")
      .update({ status: "generating", generator_error: null, updated_at: new Date().toISOString() })
      .eq("id", id).eq("status", "failed").select("id").maybeSingle();
    if (error || !data) return { weekOf: week, status: "already-running", created: false };
  }
  const key = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("NEWSLETTER_GEMINI_MODEL") || "gemini-3.5-flash-lite";
  if (!key || !/^[a-z0-9.-]+$/i.test(model)) {
    await client.from("newsletter_editions").update({
      status: "failed", generator_error: "Configure a free Gemini API key and model first.",
    }).eq("id", id).eq("status", "generating");
    return { weekOf: week, created: false, status: "needs-free-provider" };
  }
  try {
    const rotation = (Math.floor(Date.parse(week + "T00:00:00Z") / (7 * 86_400_000)) % sources.length);
    const selected = [sources[rotation], sources[(rotation + 3) % sources.length], sources[(rotation + 6) % sources.length]];
    const allowedLinks = selected.map(s => "https://www.thetradehq.com" + s.path);
    const request = {
      contents: [{ role: "user", parts: [{ text: JSON.stringify({
        task: "Write a friendly weekly TradeHQ educational newsletter DRAFT for editorial review. Return JSON only. No email is sent by this operation.",
        weekOf: week,
        allowedPublishedArticles: selected.map(s => ({ ...s, url: "https://www.thetradehq.com" + s.path })),
        constraints: [
          "Ground the piece ONLY in the article summaries supplied. Do not invent news, current prices, returns, regulatory changes, reviews, statistics, achievements, or financial advice.",
          "Friendly, concise, personable voice. One practical learning challenge with hypothetical arithmetic or observation; label assumptions.",
          "TradeHQ has $100,000 virtual starting balance and manual spot-style market orders; quotes may be simulated, cached, delayed or unavailable. No real-money trading, pending stop/limit, options or futures execution.",
          "Write 300–450 original words: compelling subject, concise preheader, clear section headings, 2–3 approved article links only. Avoid salesy or institutional claims.",
          "Provide all links as full canonical https://www.thetradehq.com URLs, never links outside the allowed list.",
          "Do not include unsub or subscription management wording inside body; the eventual provider/approval system will add required footer and headers.",
          "Do not claim this has been fact-checked by a professional or sourced to current events. Avoid price predictions and urgent trading prompts."
        ],
      }) }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1700,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            subject: { type: "STRING" },
            preheader: { type: "STRING" },
            body_markdown: { type: "STRING" },
          },
          required: ["subject", "preheader", "body_markdown"],
        },
      },
    };
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
      { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(request), signal: AbortSignal.timeout(25000) },
    );
    if (!response.ok) throw Error("AI provider rejected request");
    const raw = await response.text();
    if (raw.length > 30000) throw Error("Provider response too large");
    const result = JSON.parse(raw);
    const draft = JSON.parse(result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
    if (!validateDraft(draft.subject, draft.preheader, draft.body_markdown)) throw Error("AI draft failed editorial validation");
    const { error } = await client.from("newsletter_editions").update({
      subject: draft.subject.trim(), preheader: draft.preheader.trim(), body_markdown: draft.body_markdown.trim(),
      source_links: allowedLinks, status: "draft", ai_model: model,
      generator_error: null, updated_at: new Date().toISOString(),
    }).eq("id", id).eq("status", "generating");
    if (error) throw Error("Could not persist draft");
    return { weekOf: week, created: true, status: "draft" };
  } catch {
    await client.from("newsletter_editions").update({
      status: "failed",
      generator_error: "AI generation or content validation failed. No edition was approved or sent.",
      updated_at: new Date().toISOString(),
    }).eq("id", id).eq("status", "generating");
    return { weekOf: week, created: false, status: "failed" };
  }
}
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  if (!(await allow("newsletter-admin-global", "newsletter-global", 60, 10))
     || !(await allow("newsletter-admin-ip:" + clientIp(req), "newsletter-ip", 60, 10))) {
    return reply({ error: "Too many requests" }, 429);
  }
  const scheduled = equalSecret(Deno.env.get("NEWSLETTER_SCHEDULER_TOKEN"), req.headers.get("x-newsletter-scheduler"));
  const admin = equalSecret(Deno.env.get("ADMIN_MASTER_KEY"), req.headers.get("x-admin-key"));
  if (!admin && !scheduled) return reply({ error: "Unauthorized" }, 401);
  let body: Record<string, unknown>;
  try { const raw = await req.text(); if (raw.length > 14000) return reply({ error: "Too large" }, 413); body = JSON.parse(raw); }
  catch { return reply({ error: "Invalid JSON" }, 400); }
  const action = typeof body.action === "string" ? body.action : "";
  if (scheduled && !admin && action !== "generate-weekly") return reply({ error: "Forbidden" }, 403);
  try {
    if (action === "list" && admin) {
      const { data, error } = await client.from("newsletter_editions")
        .select("id,week_of,status,revision,subject,preheader,body_markdown,reviewed_by,reviewed_at,updated_at,generator_error,ai_model")
        .order("week_of", { ascending: false }).limit(16);
      if (error) throw Error();
      return reply({ data: data as Draft[] });
    }
    if (action === "generate-weekly") return reply({ data: await generate(thisMondayColombo()) });
    const id = body.id, revision = body.revision;
    if (!admin || typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(revision) || Number(revision) < 1)
      return reply({ error: "Invalid edition" }, 400);
    if (action === "save") {
      if (!validateDraft(body.subject, body.preheader, body.body_markdown))
        return reply({ error: "Draft needs a subject, preheader, 250+ words of useful copy and approved article links." }, 400);
      const { data, error } = await client.from("newsletter_editions")
        .update({
          subject: String(body.subject).trim(), preheader: String(body.preheader).trim(),
          body_markdown: String(body.body_markdown).trim(),
          revision: Number(revision) + 1, reviewed_by: null, reviewed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id).eq("revision", revision).eq("status", "draft")
        .select("id,revision").maybeSingle();
      if (error || !data) return reply({ error: "Edition changed or is no longer editable. Refresh the list." }, 409);
      return reply({ data });
    }
    if (action === "approve") {
      if (body.reviewed !== true || typeof body.reviewer !== "string" || body.reviewer.trim().length < 2 || body.reviewer.length > 80)
        return reply({ error: "Confirm review and enter reviewer name" }, 400);
      const { data, error } = await client.from("newsletter_editions")
        .update({ status: "approved", reviewed_by: body.reviewer.trim(), reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id).eq("revision", revision).eq("status", "draft")
        .select("id,status").maybeSingle();
      if (error || !data) return reply({ error: "Edition changed. Refresh before approving." }, 409);
      return reply({ data, note: "Approved editorially only. No emails sent. A permission-based delivery service is not activated." });
    }
    return reply({ error: "Unknown action" }, 400);
  } catch {
    return reply({ error: "Newsletter store unavailable. Confirm migration, function and secrets are deployed." }, 503);
  }
});
