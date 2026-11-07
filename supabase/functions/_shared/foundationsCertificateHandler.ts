import { issueFoundationsCertificate } from "./foundationsCertificate.ts";

type CertificateStore = Parameters<typeof issueFoundationsCertificate>[0];
const maxBodyBytes = 1024;

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBodyBytes) throw new RangeError();
  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBodyBytes) {
        void reader.cancel().catch(() => {});
        throw new RangeError();
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

export function createFoundationsCertificateHandler(options: {
  authenticate: (token: string) => Promise<string | null>;
  admit: (userId: string) => Promise<boolean>;
  store: CertificateStore;
}) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  };
  const reply = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers });

  return async (request: Request) => {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply({ status: "method_not_allowed" }, 405);

    const bearer = /^Bearer ([A-Za-z0-9_.-]{20,8192})$/.exec(request.headers.get("authorization") ?? "");
    if (!bearer) return reply({ status: "unauthenticated" }, 401);

    try {
      const userId = await options.authenticate(bearer[1]);
      if (!userId) return reply({ status: "unauthenticated" }, 401);
      if (!await options.admit(userId)) return reply({ status: "rate_limited" }, 429);

      let input: unknown;
      try {
        input = await readBody(request);
      } catch (error) {
        return error instanceof RangeError
          ? reply({ status: "request_too_large" }, 413)
          : reply({ status: "invalid_request" }, 400);
      }
      if (!input || typeof input !== "object" || Array.isArray(input)
          || Object.keys(input).some(key => key !== "milestone" && key !== "recipientName")) {
        return reply({ status: "invalid_request" }, 400);
      }
      const { milestone, recipientName } = input as Record<string, unknown>;
      const result = await issueFoundationsCertificate(options.store, userId, milestone, recipientName);
      if (result.status === "available") {
        const { id, issuedAt, recipientName, milestone, templateVersion, programmeVersion } = result.certificate;
        return reply({ status: result.status, certificate: { id, issuedAt, recipientName, milestone, templateVersion, programmeVersion } }, 200);
      }
      return reply(result, result.status === "ineligible" ? 409 : 400);
    } catch {
      return reply({ status: "unavailable" }, 503);
    }
  };
}
