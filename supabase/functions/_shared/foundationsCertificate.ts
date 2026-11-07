import {
  FOUNDATIONS_VERSION,
  getFoundationsEligibility,
  type CertificateMilestone,
  type GradedFoundationsAttempt,
} from "./foundationsProgramme.ts";

export const FOUNDATIONS_CERTIFICATE_TEMPLATE = "trade-hq-white-teal-v1";

type CertificateKey = Readonly<{
  userId: string;
  programmeVersion: typeof FOUNDATIONS_VERSION;
  milestone: CertificateMilestone;
}>;

type CertificateRecord = Readonly<CertificateKey & {
  id: string;
  issuedAt: string;
  recipientName: string;
  templateVersion: string;
}>;

type CertificateStore = {
  findPrivateCertificate(key: CertificateKey): Promise<CertificateRecord | null>;
  readServerGradedAttempts(userId: string, version: typeof FOUNDATIONS_VERSION):
    Promise<readonly GradedFoundationsAttempt[]>;
  // Atomically insert or return the existing row for this key. The database
  // owns the ID and issue timestamp. New rows must default to private.
  createOrReadPrivateCertificate(record: CertificateKey & {
    recipientName: string;
    templateVersion: typeof FOUNDATIONS_CERTIFICATE_TEMPLATE;
  }): Promise<CertificateRecord>;
};

export function isCertificateMilestone(value: unknown): value is CertificateMilestone {
  return value === "first-course" || value === "core-studies" || value === "foundations";
}

function readRecipientName(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 200 ||
      /[\u0000-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/u.test(value)) return null;
  const name = value.normalize("NFC").trim();
  return [...name].length <= 100 && /\p{L}/u.test(name) ? name : null;
}

/** Server use case. The caller must derive userId from a verified session,
 * never from the request payload. Score evidence comes only from the store.
 */
export async function issueFoundationsCertificate(
  store: CertificateStore,
  userId: string | null,
  milestone: unknown,
  confirmedName: unknown,
) {
  if (!userId) return { status: "unauthenticated" } as const;
  if (!isCertificateMilestone(milestone)) return { status: "invalid_milestone" } as const;

  const key: CertificateKey = { userId, programmeVersion: FOUNDATIONS_VERSION, milestone };
  const existing = await store.findPrivateCertificate(key);
  if (existing) return { status: "available", certificate: existing } as const;

  const recipientName = readRecipientName(confirmedName);
  if (!recipientName) return { status: "invalid_recipient_name" } as const;

  const evidence = await store.readServerGradedAttempts(userId, FOUNDATIONS_VERSION);
  if (!getFoundationsEligibility(evidence).milestones.includes(milestone)) {
    return { status: "ineligible" } as const;
  }

  const certificate = await store.createOrReadPrivateCertificate({
    ...key, recipientName, templateVersion: FOUNDATIONS_CERTIFICATE_TEMPLATE,
  });
  return { status: "available", certificate } as const;
}
