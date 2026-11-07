import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { createFoundationsCertificateHandler } from "../_shared/foundationsCertificateHandler.ts";
import { FOUNDATIONS_VERSION } from "../_shared/foundationsProgramme.ts";
import { issueFoundationsCertificate } from "../_shared/foundationsCertificate.ts";
import { allow } from "../_shared/rateLimit.ts";

const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const columns = "id,user_id,programme_version,milestone,recipient_name,template_version,issued_at";

type CertificateStore = Parameters<typeof issueFoundationsCertificate>[0];
type Certificate = NonNullable<Awaited<ReturnType<CertificateStore["findPrivateCertificate"]>>>;
function toCertificate(row: {
  id: string; user_id: string; programme_version: Certificate["programmeVersion"];
  milestone: Certificate["milestone"]; recipient_name: string; template_version: string; issued_at: string;
}): Certificate {
  return {
    id: row.id, userId: row.user_id, programmeVersion: row.programme_version, milestone: row.milestone,
    recipientName: row.recipient_name, templateVersion: row.template_version, issuedAt: row.issued_at,
  };
}

Deno.serve(createFoundationsCertificateHandler({
  async authenticate(token) {
    const { data, error } = await client.auth.getUser(token);
    if (error && (!error.status || error.status === 429 || error.status >= 500)) throw error;
    if (error || data.user?.aud !== "authenticated" || data.user.is_anonymous) return null;
    return data.user.id;
  },
  admit: userId => allow(userId, "foundations-certificate", 60, 12),
  async readAssessment(assessmentId) {
    const { data, error } = await client.from("foundations_assessment_items")
      .select("reviewed_content").eq("programme_version", FOUNDATIONS_VERSION).eq("assessment_id", assessmentId).single();
    if (error) throw error;
    return data.reviewed_content;
  },
  async recordGrade(userId, grade) {
    const { error } = await client.rpc("record_foundations_assessment", {
      p_user_id: userId, p_programme_version: grade.programmeVersion, p_assessment_id: grade.assessmentId,
      p_points: grade.points, p_possible: grade.possible,
    });
    if (error) throw error;
  },
  store: {
    async findPrivateCertificate(key) {
      const { data, error } = await client.from("foundations_private_certificates")
        .select(columns).eq("user_id", key.userId).eq("programme_version", key.programmeVersion)
        .eq("milestone", key.milestone).maybeSingle();
      if (error) throw error;
      return data ? toCertificate(data as Parameters<typeof toCertificate>[0]) : null;
    },
    async readServerGradedAttempts(userId, version) {
      const { data, error } = await client.from("foundations_assessment_results")
        .select("programme_version,assessment_id,points,possible")
        .eq("user_id", userId).eq("programme_version", version);
      if (error) throw error;
      return data.map(row => ({
        programmeVersion: row.programme_version, assessmentId: row.assessment_id, points: row.points, possible: row.possible,
      }));
    },
    async createOrReadPrivateCertificate(record) {
      const { data, error } = await client.rpc("create_or_read_foundations_certificate", {
        p_user_id: record.userId, p_programme_version: record.programmeVersion, p_milestone: record.milestone,
        p_recipient_name: record.recipientName, p_template_version: record.templateVersion,
      }).single();
      if (error) throw error;
      return toCertificate(data as Parameters<typeof toCertificate>[0]);
    },
  },
}));
