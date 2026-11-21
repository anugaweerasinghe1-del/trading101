/**
 * Exact-source, read-only Cloudflare production gate for protected main.
 * Does not grant publication, rollbacks, quotas, or trust unrelated providers.
 */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { setTimeout as pause } from "node:timers/promises";
import { checkPublicRoute } from "./agent-release-recovery-readiness.mjs";

const REPO = "anugaweerasinghe1-del/trading101";
const ACCOUNT = "01087d56e4cb7b728a7a9ddbcb12b9bb";
const PROJECT = "tradehq-preview";
const SHA = /^[a-f0-9]{40}$/;
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const ORIGIN = "https://www.thetradehq.com";
const PROJECT_URL = "https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT + "/pages/projects/" + PROJECT;
const HEAD_URL = "https://api.github.com/repos/" + REPO + "/branches/main";

export function assertActiveCloudflareProject(project, sha) {
  assert.ok(SHA.test(sha), "Immutable expected commit SHA required");
  assert.ok(project && project.name === PROJECT && project.production_branch === "main"
    && typeof project.id === "string" && project.id.length > 0, "Unexpected Pages project/main binding");
  const d = project.canonical_deployment;
  assert.ok(d && UUID.test(d.id || "") && d.project_id === project.id &&
    d.project_name === PROJECT && d.environment === "production" &&
    d.deployment_trigger?.metadata?.branch === "main", "Active Pages deployment identity not trusted");
  const actual = d.deployment_trigger.metadata.commit_hash;
  assert.ok(SHA.test(actual || ""), "Cloudflare deployment has no immutable commit identity");
  assert.ok(d.latest_stage?.status === "success", "Active Cloudflare deployment is not successful");
  assert.equal(actual, sha, "Cloudflare active main deployment has not reached this SHA");
  const domains = Array.isArray(project.domains) ? project.domains.filter(d => typeof d === "string") : [];
  return Object.freeze({ sha: actual, deploymentId: d.id,
    customDomainBound: domains.includes("www.thetradehq.com"), domainsReported: domains.length > 0 });
}

async function getJson(url, token, cloudflare = false) {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000),
    headers: { Authorization: "Bearer " + token, Accept: cloudflare ? "application/json" : "application/vnd.github+json" } });
  assert.equal(response.status, 200, cloudflare ? "Cloudflare project read unavailable" : "Protected GitHub branch read unavailable");
  const raw = await response.text();
  assert.ok(Buffer.byteLength(raw, "utf8") < 500000, "Provider response exceeds release evidence bound");
  return JSON.parse(raw);
}
async function verifyMain(sha, token) {
  const head = await getJson(HEAD_URL, token);
  assert.ok(head.commit?.sha === sha && head.protected === true,
    "Protected main SHA differs from the immutable release candidate");
}

export async function verifyCloudflareProduction({ sha, githubToken, cloudflareToken,
  getHead = () => verifyMain(sha, githubToken),
  getProject = async () => {
    const envelope = await getJson(PROJECT_URL, cloudflareToken, true);
    assert.ok(envelope.success === true && envelope.result, "Cloudflare project evidence invalid");
    return envelope.result;
  },
  checkRoute = checkPublicRoute, tries = 20, sleep = pause } = {}) {
  assert.ok(SHA.test(sha || "") && typeof githubToken === "string" && githubToken.length >= 20 &&
    typeof cloudflareToken === "string" && cloudflareToken.length >= 20,
    "Exact SHA and both read-only provider credentials are required");
  assert.ok(Number.isSafeInteger(tries) && tries >= 1 && tries <= 20, "Bounded release polling required");
  await getHead();
  let receipt;
  for (let i = 0; i < tries; i++) {
    try {
      receipt = assertActiveCloudflareProject(await getProject(), sha);
      break;
    } catch (error) {
      if (!["Cloudflare active main deployment has not reached this SHA",
        "Active Cloudflare deployment is not successful"].includes(error?.message) || i === tries - 1) throw error;
      await sleep(15000);
    }
  }
  assert.ok(receipt, "Active Cloudflare release not verified");
  // Public availability alone never substitutes for authenticated provider SHA proof.
  for (const path of ["/", "/start", "/learn", "/daily", "/trade"])
    await checkRoute(path);
  await getHead(); // Refuse stale status when another merge arrived during verification.
  return Object.freeze({ source: "authenticated_cloudflare_pages_api", project: PROJECT,
    ...receipt, routesChecked: 5, verifiedMain: true, status: "CLOUDFLARE_PRODUCTION_VERIFIED",
    limitations: receipt.customDomainBound ? [] :
      ["The project response did not itself prove the public custom-domain binding; five public routes were sampled separately."] });
}

async function run() {
  assert.equal(process.env.GITHUB_REPOSITORY, REPO, "Unexpected repository");
  assert.equal(process.env.GITHUB_REF, "refs/heads/main", "Production gate is main-only");
  const proof = await verifyCloudflareProduction({
    sha: process.env.GITHUB_SHA, githubToken: process.env.GITHUB_TOKEN,
    cloudflareToken: process.env.CLOUDFLARE_API_TOKEN,
  });
  console.log("TRADEHQ_CLOUDFLARE_PRODUCTION_RECEIPT " + JSON.stringify(proof));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(error => {
    console.error("CLOUDFLARE_RELEASE_NOT_VERIFIED: " +
      String(error?.message || "Unknown provider failure").replace(/\s+/g, " ").slice(0,180));
    process.exitCode = 1;
  });
}
