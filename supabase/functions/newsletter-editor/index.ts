import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { allow, clientIp } from "../_shared/rateLimit.ts";
import { NEWSLETTER_LABS, newsletterLab, appendVerifiedLab, validateNewsletterCopy } from "../_shared/newsletterLabs.ts";

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
// Human edits may depart from AI's format. Keep source verification and
// anti-promotion checks, but don't force a specific AI-authored worksheet.
function validateDraft(subject: unknown, preheader: unknown, body: unknown): boolean {
  if (typeof subject !== "string" || subject.trim().length < 10 || subject.length > 140) return false;
  if (typeof preheader !== "string" || preheader.trim().length < 10 || preheader.length > 240) return false;
  if (typeof body !== "string" || body.trim().length > 12000) return false;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words < 180 || words > 1000) return false;
  const links = [...body.matchAll(/https?:\/\/[^\s)>\]]+/g)].map(m => m[0].replace(/[.,;]$/, ""));
  const safe = new Set(NEWSLETTER_LABS.map(t => t.sourceUrl));
  const ownLinks = links.filter(url => url.startsWith("https://www.thetradehq.com/"));
  if (links.length < 1 || links.length > 4 || ownLinks.length > 1 || links.some(link =>
    !safe.has(link) && !link.startsWith("https://www.thetradehq.com/learn/article/"))) return false;
  if ((body.match(/\bTradeHQ\b/gi)||[]).length > 2) return false;
  if (/guarantee(?:d|s)?\s+(returns?|profit)|risk[- ]free\s+(trading|investing)|real[- ]time\s+(market|price|data)|licensed\s+(financial|adviser)/i.test(subject + " " + body)) return false;
  return true;
}

type LessonDraft = { subject: string; preheader: string; body_markdown: string; source_links: string[]; ai_model: string };
async function composeOriginalNewsletter(week: string, topicId?: string): Promise<LessonDraft> {
  const lab = newsletterLab(week, topicId);
  const { data: credentials, error: credentialError } = await client.rpc("newsletter_ai_credentials");
  const key = credentialError ? null : (credentials?.apiKey as string | null);
  const model = credentialError ? "" : (credentials?.model as string || "");
  if (!credentials?.freeConfirmed || !key || !["gemini-3.5-flash", "gemini-3.5-flash-lite"].includes(model))
    throw Error("Free-tier Gemini credentials are not configured");
  const request = {
    contents: [{ role: "user", parts: [{ text: JSON.stringify({
      task: "Write a genuinely useful, ORIGINAL standalone financial-literacy email lesson. Return JSON only. This is an UNPUBLISHED draft; never email or publish.",
      weekOf: week,
      editorialAngle: lab.title,
      primarySource: { name: lab.sourceTitle, url: lab.sourceUrl, supports: lab.sourceScope },
      authorPreparedWorkedExample: { assumptions: lab.puzzle, answerToRespect: lab.answer, limitations: lab.limitation, takeaway: lab.takeaway },
      instructions: [
        "The reader should gain a reusable analytical habit, not hear about the TradeHQ product. Never repeat or advertise existing site articles, features, $100,000 virtual cash or trading terminal.",
        "Teach ONE subtle, non-obvious distinction in substantial depth. No generic 'learn trading' tips, buzzword lists, filler greetings, hype, or product CTA. Prefer a vivid fictional dilemma, counterintuitive insight and realistic alternatives/tradeoffs.",
        "Write 330–460 words in body_markdown, exclusive of the verified worksheet the server appends. Friendly, precise, curious and human. Use ## The hidden trap; ## What changes the decision; ## A useful habit. Include one thought-provoking question.",
        "Use ONLY the supplied source scope and fictional arithmetic. Do not invent regulators' exact statements, dates, market prices, headlines, backtests, success probabilities or financial credentials.",
        "Do not provide personally tailored buy/sell recommendations or claim profitability. Explain mechanisms, assumptions, uncertainty and the main failure case. No claims that the advice is exclusive to this newsletter.",
        "Do not include Markdown links or any URLs in body_markdown—the server supplies a verified primary reference and exact checked numerical worksheet. Do not repeat the full numerical answer; refer to the worksheet following your explanation.",
        "Do NOT mention TradeHQ at all in the body. Branding belongs to the email sender; if adding promotional copy would displace education, omit it.",
        "Give the subject a concrete intellectual hook, not 'Your TradeHQ Weekly' or 'Latest Guides'. The preheader should promise a tangible lesson, not a product update.",
        "Avoid guarantees, affiliate offers, urgency and personalized investment advice."
      ],
    }) }] }],
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingLevel: "LOW" },
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          preheader: { type: "string" },
          body_markdown: { type: "string" },
        },
        required: ["subject", "preheader", "body_markdown"],
      },
    },
  };
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
    { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(request), signal: AbortSignal.timeout(52000) },
  );
  if (!response.ok) throw Error("Free-tier model rejected newsletter request");
  const raw = await response.text();
  if (raw.length > 30000) throw Error("Provider response too large");
  const result = JSON.parse(raw);
  const draft = JSON.parse(result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
  if (typeof draft.body_markdown !== "string" || /https?:\/\/|TradeHQ/i.test(draft.body_markdown))
    throw Error("Generated narrative included prohibited links or promotion");
  const body = appendVerifiedLab(draft.body_markdown, lab);
  if (!validateNewsletterCopy(draft.subject, draft.preheader, body, lab))
    throw Error("Newsletter failed original-value and source checks");
  return {
    subject: draft.subject.trim(), preheader: draft.preheader.trim(),
    body_markdown: body, source_links: [lab.sourceUrl], ai_model: model,
  };
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
  try {
    const draft = await composeOriginalNewsletter(week);
    const { error } = await client.from("newsletter_editions").update({
      ...draft, status: "draft", generator_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", id).eq("status", "generating");
    if (error) throw Error("Could not save private lesson");
    return { weekOf: week, created: true, status: "draft" };
  } catch {
    await client.from("newsletter_editions").update({
      status: "failed",
      generator_error: "AI drafting or educational content validation failed. No email was sent.",
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
  const schedulerToken = req.headers.get("x-newsletter-scheduler");
  let scheduled = equalSecret(Deno.env.get("NEWSLETTER_SCHEDULER_TOKEN"), schedulerToken);
  if (!scheduled && schedulerToken && schedulerToken.length === 64) {
    // SQL only grants this check to the Edge function's service role.
    const result = await client.rpc("newsletter_scheduler_authorized", { p_token: schedulerToken });
    scheduled = !result.error && result.data === true;
  }
  const configuredAdminKey = Deno.env.get("ADMIN_MASTER_KEY");
  if (!configuredAdminKey && !scheduled) {
    // A missing environment secret is a deployment/configuration failure, not
    // evidence that the visitor mistyped an otherwise valid master key.
    return reply({ error: "Newsletter administrator configuration is missing." }, 503);
  }
  const admin = equalSecret(configuredAdminKey, req.headers.get("x-admin-key"));
  if (!admin && !scheduled) return reply({ error: "Incorrect TradeHQ admin master key." }, 401);
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
    if (action === "topics" && admin) {
      return reply({ data: NEWSLETTER_LABS.map(t => ({ id: t.id, title: t.title, sourceTitle: t.sourceTitle })) });
    }
    const id = body.id, revision = body.revision;
    if (!admin || typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(revision) || Number(revision) < 1)
      return reply({ error: "Invalid edition" }, 400);
    if (action === "reopen") {
      // Approved is an editorial state only. Explicitly invalidate approval,
      // retaining the text, before allowing further edits or AI preview.
      const { data, error } = await client.from("newsletter_editions")
        .update({ status: "draft", reviewed_by: null, reviewed_at: null,
          revision: Number(revision) + 1, updated_at: new Date().toISOString() })
        .eq("id", id).eq("revision", revision).eq("status", "approved")
        .select("id,revision,status").maybeSingle();
      if (error || !data) return reply({ error: "Edition changed or is not approved. Refresh." }, 409);
      return reply({ data, note: "Editorial approval revoked for revisions. No email sent." });
    }
    if (action === "preview-rewrite") {
      const { data: current, error } = await client.from("newsletter_editions")
        .select("week_of,status,revision").eq("id", id).maybeSingle();
      if (error || !current || current.status !== "draft" || current.revision !== revision)
        return reply({ error: "Reopen and refresh the draft before requesting a new AI preview." }, 409);
      if (typeof body.topicId !== "string" || !NEWSLETTER_LABS.some(t => t.id === body.topicId))
        return reply({ error: "Choose a valid educational topic." }, 400);
      try {
        // Return an editable preview. NEVER overwrite the stored text, approval
        // or revision as a side-effect of an AI generation call.
        const preview = await composeOriginalNewsletter(current.week_of, body.topicId);
        return reply({ data: preview });
      } catch {
        return reply({ error: "AI preview failed its source or educational quality checks. Your saved draft is unchanged." }, 422);
      }
    }
    if (action === "save") {
      if (!validateDraft(body.subject, body.preheader, body.body_markdown))
        return reply({ error: "Draft needs a subject, preheader, 250+ words of useful copy and approved article links." }, 400);
      const { data, error } = await client.from("newsletter_editions")
        .update({
          subject: String(body.subject).trim(), preheader: String(body.preheader).trim(),
          body_markdown: String(body.body_markdown).trim(),
          source_links: [...String(body.body_markdown).matchAll(/https?:\/\/[^\s)>\]]+/g)].map(m => m[0].replace(/[.,;]$/, "")),
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
