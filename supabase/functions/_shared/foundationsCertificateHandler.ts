import { isCertificateMilestone, issueFoundationsCertificate, readRecipientName } from "./foundationsCertificate.ts";
import { assessmentSize, gradeFoundationsAssessment, parseFoundationsAssessment, publicFoundationsAssessment } from "./foundationsAssessment.ts";
import { FOUNDATIONS_VERSION, getFoundationsEligibility, type GradedFoundationsAttempt } from "./foundationsProgramme.ts";

type CertificateStore = Parameters<typeof issueFoundationsCertificate>[0];
const maxBodyBytes = 1024;
type Certificate = NonNullable<Awaited<ReturnType<CertificateStore["findPrivateCertificate"]>>>;

function privateDownloadMetadata({ id, issuedAt, recipientName, nameRevision, milestone, templateVersion, programmeVersion }: Certificate) {
  return { id, issuedAt, recipientName, nameRevision, milestone, templateVersion, programmeVersion };
}

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
  correctName: (key: Parameters<CertificateStore["findPrivateCertificate"]>[0], expected: number, recipientName: string) => Promise<boolean>;
  readAssessment: (assessmentId: string) => Promise<unknown>;
  recordGrade: (userId: string, grade: GradedFoundationsAttempt) => Promise<void>;
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
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        return reply({ status: "invalid_request" }, 400);
      }
      const body = input as Record<string, unknown>;
      const { action, assessmentId, answers, programmeVersion, milestone, recipientName } = body;
      const onlyKeys = (keys: string[]) => Object.keys(body).every(key => keys.includes(key));

      if (action === "progress" && onlyKeys(["action"])) {
        const evidence = await options.store.readServerGradedAttempts(userId, FOUNDATIONS_VERSION);
        return reply({ status: "available", programmeVersion: FOUNDATIONS_VERSION, ...getFoundationsEligibility(evidence) }, 200);
      }
      if (action === "assessment" || action === "grade") {
        const keys = ["action", "assessmentId", "programmeVersion"];
        const size = assessmentSize(assessmentId);
        if (typeof assessmentId !== "string" || !size || programmeVersion !== FOUNDATIONS_VERSION
            || !onlyKeys(action === "grade" ? [...keys, "answers"] : keys)) {
          return reply({ status: "invalid_request" }, 400);
        }
        const assessment = parseFoundationsAssessment(await options.readAssessment(assessmentId), size);
        if (action === "assessment") {
          return reply({ status: "available", assessment: publicFoundationsAssessment(assessmentId, assessment) }, 200);
        }
        const grade = gradeFoundationsAssessment(assessmentId, assessment, answers);
        if (!grade) return reply({ status: "invalid_request" }, 400);
        await options.recordGrade(userId, grade);
        return reply({ status: "graded", grade }, 200);
      }
      if (action === "certificate" && onlyKeys(["action", "milestone"]) && isCertificateMilestone(milestone)) {
        const certificate = await options.store.findPrivateCertificate({ userId, programmeVersion: FOUNDATIONS_VERSION, milestone });
        return certificate
          ? reply({ status: "available", certificate: privateDownloadMetadata(certificate) }, 200)
          : reply({ status: "not_issued" }, 200);
      }
      if (action === "correct_name" && onlyKeys(["action", "milestone", "recipientName", "expectedRevision"])
          && isCertificateMilestone(milestone)) {
        const name = readRecipientName(recipientName);
        const { expectedRevision } = body;
        if (!name || typeof expectedRevision !== "number" || !Number.isInteger(expectedRevision)
            || expectedRevision < 0 || expectedRevision >= 2147483647) {
          return reply({ status: "invalid_request" }, 400);
        }
        const key = { userId, programmeVersion: FOUNDATIONS_VERSION, milestone } as const;
        if (!await options.correctName(key, expectedRevision, name)) return reply({ status: "revision_conflict" }, 409);
        const certificate = await options.store.findPrivateCertificate(key);
        if (!certificate) return reply({ status: "unavailable" }, 503);
        return reply({ status: "available", certificate: privateDownloadMetadata(certificate) }, 200);
      }
      if (!onlyKeys(["milestone", "recipientName"])) return reply({ status: "invalid_request" }, 400);
      const result = await issueFoundationsCertificate(options.store, userId, milestone, recipientName);
      if (result.status === "available") {
        return reply({ status: result.status, certificate: privateDownloadMetadata(result.certificate) }, 200);
      }
      return reply(result, result.status === "ineligible" ? 409 : 400);
    } catch {
      return reply({ status: "unavailable" }, 503);
    }
  };
}
