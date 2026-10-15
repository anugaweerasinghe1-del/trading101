import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { AutomationInbox, type EditorialQueueRow } from "@/components/admin/AutomationInbox";
import { Activity, BookOpen, Bot, CalendarCheck, CheckCircle2, ExternalLink, Lock, MessageSquare, RefreshCw, ShieldCheck, Sparkles, Wrench } from "lucide-react";

type Course = { id: string; status: string; document?: { title?: string }; updated_at?: string };
type DailyStatus = { enabled?: boolean; nextDue?: string; prepareAfter?: string; completed?: number; attempts?: number; retryAfter?: string | null; lastStarted?: string | null; lastFinished?: string | null; lastError?: string | null; model?: string; hasApiKey?: boolean; freeConfirmed?: boolean };
type CourseStatus = { enabled?: boolean; model?: string; lastStarted?: string | null; lastFinished?: string | null; runs?: Array<{ status?: string; last_error?: string | null; period?: string; slot?: number }> };
type AgentIssue = { id: number; title: string; html_url: string; created_at: string; state: string; body?: string | null; pull_request?: unknown };
type Run = { id: number; status: string; conclusion: string | null; html_url: string; created_at: string; updated_at?: string; head_sha?: string };
type Proposal = { number: number; title: string; html_url: string; draft: boolean; created_at: string };
type AgentJob = { id: number; runId: number; workflow: string; name: string; status: string; conclusion: string | null; html_url: string; started_at: string };
type DeployCheck = { name: string; status: string; conclusion: string | null; details_url: string };
const repo = "anugaweerasinghe1-del/trading101";
const card = "rounded-2xl border border-border bg-card/60 p-5 space-y-3";
const linkStyle = "inline-flex items-center gap-1 text-sm text-primary hover:underline";
export default function AdminDashboard() {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [dailyBanks, setDailyBanks] = useState<EditorialQueueRow[] | null>(null);
  const [deskWarnings, setDeskWarnings] = useState<string[]>([]);
  const [daily, setDaily] = useState<DailyStatus | null>(null);
  const [courseStatus, setCourseStatus] = useState<CourseStatus | null>(null);
  const [reviews, setReviews] = useState<number | null>(null);
  const [issues, setIssues] = useState<AgentIssue[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const [codeRun, setCodeRun] = useState<Run | null>(null);
  const [collectorRun, setCollectorRun] = useState<Run | null>(null);
  const [previousSuccess, setPreviousSuccess] = useState<Run | null>(null);
  const [previousFailure, setPreviousFailure] = useState<Run | null>(null);
  const [previousCodeFailure, setPreviousCodeFailure] = useState<Run | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [agentError, setAgentError] = useState("");
  const [lastGitHubChecked, setLastGitHubChecked] = useState<Date | null>(null);
  const [jobHistory, setJobHistory] = useState<AgentJob[]>([]);
  const [jobHistoryError, setJobHistoryError] = useState("");
  const [deploymentChecks, setDeploymentChecks] = useState<{ pages: DeployCheck | null; worker: DeployCheck | null; error: string } | null>(null);
  const adminCall = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error: callError } = await supabase.functions.invoke("admin-courses", {
      body: { ...payload, action }, headers: { "x-admin-key": key },
    });
    if (callError || data?.error) throw new Error(data?.error || "Admin verification failed.");
    return data.data;
  }, [key]);
  // Verify one privileged endpoint before displaying any administration data.
  // An unrelated review or practice outage must never be interpreted as a bad master key.
  const refresh = useCallback(async () => {
    const settings = await adminCall("settings");
    if (!settings) throw new Error("Administrator verification failed.");
    setCourseStatus(settings);
    const [drafts, practice, result, banks] = await Promise.allSettled([
      adminCall("list", { summary: true }), adminCall("daily-status"),
      supabase.functions.invoke("admin-reviews", { body: { action: "list" }, headers: { "x-admin-key": key } }),
      adminCall("daily-list", { summary: true }),
    ]);
    const warnings: string[] = [];
    if (drafts.status === "fulfilled" && Array.isArray(drafts.value)) setCourses(drafts.value);
    else { setCourses(null); warnings.push("Course drafts are temporarily unavailable."); }
    if (practice.status === "fulfilled" && practice.value) setDaily(practice.value);
    else { setDaily(null); warnings.push("Daily Practice status is temporarily unavailable."); }
    if (banks.status === "fulfilled" && Array.isArray(banks.value)) setDailyBanks(banks.value);
    else { setDailyBanks(null); warnings.push("Daily bank review queue is temporarily unavailable."); }
    if (result.status === "fulfilled" && !result.value.error && !result.value.data?.error &&
        Array.isArray(result.value.data?.data)) setReviews(result.value.data.data.length);
    else { setReviews(null); warnings.push("Review moderation status is temporarily unavailable."); }
    setDeskWarnings(warnings);
  }, [adminCall, key]);
  // Public GitHub data is used only for observability, never for authorization.
  // No PAT or administrative credentials are exposed in the browser.
  const loadAgents = useCallback(async () => {
    const base = "https://api.github.com/repos/" + repo;
    const targets = [
      base + "/issues?state=all&per_page=100",
      base + "/actions/workflows/tradehq-agents.yml/runs?per_page=10",
      base + "/actions/workflows/tradehq-code-agent.yml/runs?per_page=10",
      base + "/pulls?state=open&per_page=50",
      base + "/actions/workflows/tradehq-verified-evidence.yml/runs?per_page=1",
    ];
    try {
      const responses = await Promise.all(targets.map(url => fetch(url, { headers: { Accept: "application/vnd.github+json" } })));
      const failures = responses.map((response, i) => response.ok ? "" : ["issue reports", "monitor runs", "coding runs", "approval PRs", "trusted collector"][i] + " HTTP " + response.status).filter(Boolean);
      const values = await Promise.all(responses.map(response => response.ok ? response.json() : Promise.resolve(null)));
      if (Array.isArray(values[0])) setIssues(values[0].filter((i: AgentIssue) => !i.pull_request && /^\[TradeHQ (Agent|Ideas)\]/.test(i.title)));
      if (Array.isArray(values[1]?.workflow_runs)) {
        const runs = values[1].workflow_runs as Run[];
        setRun(runs[0] ?? null);
        setPreviousSuccess(runs.find(item => item.conclusion === "success") ?? null);
        setPreviousFailure(runs.find(item => item.conclusion === "failure") ?? null);
      }
      if (Array.isArray(values[2]?.workflow_runs)) {
        const history = values[2].workflow_runs as Run[];
        setCodeRun(history[0] ?? null);
        setPreviousCodeFailure(history.find(item => item.conclusion === "failure") ?? null);
      }
      if (Array.isArray(values[3])) setProposals((values[3] as Proposal[]).filter(item => /^AI (smoke-test |proposal:)/i.test(item.title)));
      if (Array.isArray(values[4]?.workflow_runs)) setCollectorRun(values[4].workflow_runs[0] ?? null);
      else setCollectorRun(null);
      // Read only recent jobs and label sampled history honestly. Never infer that a green run means every function works.
      const recent = [
        ...(Array.isArray(values[1]?.workflow_runs) ? (values[1].workflow_runs as Run[]).slice(0, 2).map(r => ({ run: r, workflow: "Website monitor" })) : []),
        ...(Array.isArray(values[2]?.workflow_runs) ? (values[2].workflow_runs as Run[]).slice(0, 2).map(r => ({ run: r, workflow: "AI code proposals" })) : []),
      ];
      if (recent.length) {
        const jobResponses = await Promise.allSettled(recent.map(async entry => {
          const response = await fetch(base + "/actions/runs/" + entry.run.id + "/jobs?per_page=25");
          if (!response.ok) throw new Error("Job history HTTP " + response.status);
          const data = await response.json() as { jobs?: Array<{ id: number; name: string; status: string; conclusion: string | null; html_url: string; started_at: string }> };
          if (!Array.isArray(data.jobs)) throw new Error("Invalid GitHub job response");
          return data.jobs.map(job => ({ ...job, runId: entry.run.id, workflow: entry.workflow }));
        }));
        setJobHistory(jobResponses.flatMap(item => item.status === "fulfilled" ? item.value : []).sort((a, b) => (b.started_at || "").localeCompare(a.started_at || "")).slice(0, 16));
        setJobHistoryError(jobResponses.some(x => x.status === "rejected") ? "Some job histories are unavailable; verify full details on GitHub Actions." : "");
      } else {
        setJobHistory([]);
        setJobHistoryError("No recent GitHub runs were returned for job inspection.");
      }
      // Different integrations: Pages is the intended production host; a separately named Worker is not proof of a Pages failure.
      try {
        const response = await fetch(base + "/commits/main/check-runs?per_page=50");
        if (!response.ok) throw new Error("GitHub deployment status HTTP " + response.status);
        const payload = await response.json() as { check_runs?: DeployCheck[] };
        if (!Array.isArray(payload.check_runs)) throw new Error("Invalid deployment status response");
        setDeploymentChecks({
          pages: payload.check_runs.find(check => check.name === "Cloudflare Pages") || null,
          worker: payload.check_runs.find(check => check.name.startsWith("Workers Builds:")) || null,
          error: "",
        });
      } catch (failure) {
        setDeploymentChecks({ pages: null, worker: null, error: failure instanceof Error ? failure.message : "GitHub deployment checks unavailable" });
      }
      setAgentError(failures.length ? "GitHub status unavailable for " + failures.join(", ") + ". Use the linked GitHub history for confirmation." : "");
      setLastGitHubChecked(new Date());
    } catch {
      setAgentError("GitHub operational data could not be loaded. Statuses may be stale; verify in GitHub Actions.");
    }
  }, []);
  const unlock = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setBusy(true);
    try { await refresh(); setUnlocked(true); await loadAgents(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not open dashboard."); }
    finally { setBusy(false); }
  };
  const refreshDashboard = async () => {
    setBusy(true); setError("");
    try { await Promise.all([refresh(), loadAgents()]); }
    catch { setError("Dashboard refresh failed. Previous data may be stale; open the relevant desk to verify."); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!unlocked) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") { void refresh().catch(() => setError("Dashboard data refresh failed.")); void loadAgents(); }
    }, 900000);
    return () => window.clearInterval(interval);
  }, [unlocked, refresh, loadAgents]);
  const agentFindings = issues.filter(item => item.state === "open" && item.title.startsWith("[TradeHQ Agent]") && (item.title.endsWith("failures") || item.title.endsWith("failed")));
  const agentReports = issues.filter(item => item.state === "open" && item.title.startsWith("[TradeHQ Agent]") && item.title.endsWith("report"));
  const ideas = issues.filter(item => item.title.startsWith("[TradeHQ Ideas]"));
  return <main className="min-h-screen bg-background text-foreground px-4 py-10">
    <Helmet><title>Administration | TradeHQ</title><meta name="robots" content="noindex,nofollow" /></Helmet>
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs tracking-[0.2em] text-primary uppercase mb-2">TradeHQ · private workspace</p><h1 className="text-3xl font-semibold">Admin dashboard</h1><p className="text-sm text-muted-foreground mt-2">Editorial controls, community moderation, automated checks and proposed improvements in one place.</p></div>
        <div className="flex gap-3">{unlocked && <button type="button" onClick={() => { setUnlocked(false); setKey(""); setCourses(null); setDailyBanks(null); setDeskWarnings([]); setDaily(null); setCourseStatus(null); setReviews(null); setIssues([]); setRun(null); setCodeRun(null); setCollectorRun(null); setPreviousSuccess(null); setPreviousFailure(null); setPreviousCodeFailure(null); setProposals([]); setAgentError(""); setLastGitHubChecked(null); setJobHistory([]); setJobHistoryError(""); setDeploymentChecks(null); }} className="rounded-xl border border-border px-4 py-2 flex items-center gap-2 text-sm"><Lock className="w-4 h-4"/> Lock</button>}<Link to="/" className={linkStyle}>View website <ExternalLink className="h-3 w-3"/></Link></div>
      </header>
      {!unlocked ? <form onSubmit={unlock} className="max-w-md rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex gap-3 items-center"><ShieldCheck className="w-6 h-6 text-primary"/><h2 className="font-semibold">Verify administrator access</h2></div>
        <p className="text-sm text-muted-foreground">Uses the same server-checked master key as the existing Course and Review desks. The key is held only in memory on this page.</p>
        <label className="block text-sm space-y-2"><span>Admin master key</span><input type="password" autoComplete="off" required value={key} onChange={event => setKey(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3"/></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium disabled:opacity-50">{busy ? "Verifying…" : "Open dashboard"}</button>
      </form> : <>
        {error && <p role="alert" className="text-sm text-amber-400">{error}</p>}
        {deskWarnings.length > 0 && <div role="status" className="rounded-xl border border-amber-500/30 px-4 py-3 text-sm text-amber-400"><strong>Some admin services are unavailable.</strong> {deskWarnings.join(" ")} Verified services remain accessible.</div>}
        <div className="flex flex-wrap justify-between gap-3 items-center"><h2 className="text-lg font-semibold">Operations overview</h2><button type="button" disabled={busy} className="text-sm border border-border rounded-xl px-4 py-2 flex items-center gap-2 disabled:opacity-40" onClick={() => void refreshDashboard()}><RefreshCw className="w-4 h-4"/> Refresh</button></div>
        <AutomationInbox courses={courses} dailyBanks={dailyBanks} daily={daily}
          failedCourseRuns={courseStatus?.runs?.filter(item => item.status === 'paused' && item.last_error).length ?? 0}
          findingCount={agentFindings.length} proposalCount={proposals.length} githubAvailable={!agentError && !!lastGitHubChecked} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <section className={card}><BookOpen className="w-6 h-6 text-primary"/><h3 className="font-semibold">Courses</h3><p className="text-2xl font-semibold">{courses === null ? "—" : courses.filter(c => c.status === "draft").length} <span className="text-sm font-normal text-muted-foreground">drafts awaiting review</span></p><p className="text-xs text-muted-foreground">Generation: {courseStatus ? (courseStatus.enabled ? "enabled" : "paused") : "unavailable"} · {courseStatus?.model || "unknown"}</p><Link className={linkStyle} to="/admin/courses">Manage drafts and approvals →</Link></section>
          <section className={card}><CalendarCheck className="w-6 h-6 text-primary"/><h3 className="font-semibold">Daily practice</h3><p className="text-2xl font-semibold">{daily ? (daily.completed ?? 0) + "/50" : "—"} <span className="text-sm font-normal text-muted-foreground">next bank ready</span></p><p className="text-xs text-muted-foreground">{daily ? (daily.enabled ? "Schedule enabled" : "Schedule paused") : "Schedule unavailable"} · Next due {daily?.nextDue || "unknown"}</p>{daily?.lastError && <p className="text-xs text-amber-400">{daily.lastError}</p>}<Link className={linkStyle} to="/admin/daily">Review questions and schedule →</Link></section>
          <section className={card}><MessageSquare className="w-6 h-6 text-primary"/><h3 className="font-semibold">Community reviews</h3><p className="text-2xl font-semibold">{reviews ?? "—"} <span className="text-sm font-normal text-muted-foreground">reviews in moderation desk</span></p><Link className={linkStyle} to="/admin/reviews">Reply, feature or moderate →</Link></section>
        </div>
        <section id="monitor-findings" tabIndex={-1} className={card}>
          <div className="flex gap-3 items-center"><Activity className="w-5 h-5 text-primary"/><h2 className="font-semibold">Automated website checks</h2></div>
          <p className="text-sm text-muted-foreground">Read-only GitHub Actions checks inspect public routes, deployed assets and a sample of pages in headless Chrome. Status reports show what was checked and when; no agent logs in, places trades or edits production.</p>
          <p className="text-sm">{run ? <>Latest run: <strong>{run.conclusion || run.status}</strong> · {new Date(run.created_at).toLocaleString()}</> : "No monitoring workflow status could be verified from GitHub."}</p>
          <div className="flex flex-wrap gap-4"><a className={linkStyle} href={"https://github.com/" + repo + "/actions/workflows/tradehq-agents.yml"} target="_blank" rel="noopener noreferrer">View execution history <ExternalLink className="w-3 h-3"/></a><span className="text-sm text-muted-foreground">{agentError ? "Findings unavailable" : agentFindings.length + " open potential failure(s)"}</span></div>
          {agentReports.length ? <div className="grid gap-2 sm:grid-cols-2">{agentReports.map(item => <a key={item.id} href={item.html_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-border p-3 text-sm hover:border-primary/40"><strong>{item.title.replace("[TradeHQ Agent] ", "")}</strong><span className="block text-xs text-muted-foreground mt-1">{(item.body || "").match(/\*\*Checked at \(UTC\):\*\*\s*([^\n]+)/)?.[1] || "Read latest inspection details"} · Evidence ↗</span></a>)}</div> : <p className="text-sm text-muted-foreground">No daily or browser-scan report exists yet. The scheduled workflow has not proven a completed inspection.</p>}
          {agentFindings.length === 0 && !agentError ? <p className="text-sm text-muted-foreground">No open findings reported. This does not imply that every feature has been tested.</p> : <div className="space-y-2">{agentFindings.map(item => <div key={item.id} className="rounded-xl border border-border p-3 space-y-2"><a href={item.html_url} target="_blank" rel="noopener noreferrer" className="block text-sm hover:underline">{item.title}<span className="block text-xs text-muted-foreground mt-1">{new Date(item.created_at).toLocaleString()} · See evidence and reproduction steps ↗</span></a><a className={linkStyle} target="_blank" rel="noopener noreferrer" href={"https://github.com/" + repo + "/issues/new?" + new URLSearchParams({ title: "[TradeHQ Code Request]", body: ("Investigate this site-monitor finding and propose a safe frontend-only fix without changing backend/auth or trading logic. Finding: " + item.html_url + "\n\n" + (item.body || "").slice(0,1200)).slice(0,2400) }).toString()}>Propose a reviewed AI fix <ExternalLink className="h-3 w-3"/></a></div>)}</div>}
        </section>
        <section className={card}>
          <div className="flex items-center gap-3"><Bot className="w-5 h-5 text-primary"/><h2 className="font-semibold">Automation operations and approvals</h2></div>
          <p className="text-sm text-muted-foreground">Live read-only workflow records from GitHub, not simulated agent activity. Scheduled times are targets, not guarantees of execution. Source: public GitHub Actions; if API access fails, inspect the links below.</p>
          {agentError && <p role="status" className="text-sm text-amber-400">{agentError}</p>}
          {lastGitHubChecked && <p className="text-xs text-muted-foreground">GitHub last checked: {lastGitHubChecked.toLocaleString()} · Background refresh at most every 15 minutes while this page is open.</p>}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-semibold text-sm">Route scanner + independent browser smoke</h3>
              <p className="text-xs text-muted-foreground">Scheduled daily at 08:47 Sri Lanka time (03:17 UTC). Route and Chrome jobs run independently; a successful workflow means both relevant jobs completed.</p>
              <p className="text-sm">Latest: <strong>{run ? run.conclusion || run.status : "Unavailable"}</strong></p>
              <p className="text-xs text-muted-foreground">Last successful workflow within recent history: {previousSuccess ? new Date(previousSuccess.created_at).toLocaleString() : "Not verified"}</p>
              <p className="text-xs text-muted-foreground">Last failed within sampled ten runs: {previousFailure ? new Date(previousFailure.created_at).toLocaleString() : "None verified"}</p>
              {previousFailure && <a href={previousFailure.html_url} target="_blank" rel="noopener noreferrer" className={linkStyle}>Inspect failed run #{previousFailure.id} ↗</a>}
              {run && <a href={run.html_url} target="_blank" rel="noopener noreferrer" className={linkStyle}>Latest run #{run.id} <ExternalLink className="w-3 h-3"/></a>}
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-semibold text-sm">Gemini ideas + reviewed code proposals</h3>
              <p className="text-xs text-muted-foreground">Ideas scheduled monthly on the 1st at 10:11 Sri Lanka time (04:41 UTC). Code proposals run only when the repository owner opens a qualified GitHub issue.</p>
              <p className="text-sm">Latest code workflow: <strong>{codeRun ? codeRun.conclusion || codeRun.status : "Unavailable"}</strong></p>
              {codeRun && <a href={codeRun.html_url} target="_blank" rel="noopener noreferrer" className={linkStyle}>View coding run #{codeRun.id} <ExternalLink className="w-3 h-3"/></a>}
              <p className="text-xs text-muted-foreground">Last failed code-agent run in sample: {previousCodeFailure ? new Date(previousCodeFailure.created_at).toLocaleString() : "None verified"}</p>
              {previousCodeFailure && <a href={previousCodeFailure.html_url} target="_blank" rel="noopener noreferrer" className={linkStyle}>Inspect code-agent failure ↗</a>}
              <p className="text-xs text-muted-foreground">An Actions success does not prove a PR was created. Verify the draft and approval below.</p>
            </div>
          </div>
          <h3 className="text-sm font-semibold">Cloudflare Git deployment checks (main)</h3>
          <p className="text-xs text-muted-foreground">Read-only check records attached to the newest main commit. These do not prove which build is currently serving the live domain. Pages is the active intended host; the separately named Worker is a distinct integration.</p>
          {deploymentChecks?.error && <p className="text-xs text-amber-400">{deploymentChecks.error}. Inspect Cloudflare directly before releasing.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3 text-sm space-y-1"><strong>Cloudflare Pages · tradehq-preview</strong><p className={deploymentChecks?.pages?.conclusion === "failure" ? "text-amber-400" : "text-xs text-muted-foreground"}>{deploymentChecks?.pages ? (deploymentChecks.pages.conclusion || deploymentChecks.pages.status) : "Unavailable / not reported"}</p>{deploymentChecks?.pages?.details_url && <a className={linkStyle} href={deploymentChecks.pages.details_url} target="_blank" rel="noopener noreferrer">Pages build evidence ↗</a>}</div>
            <div className="rounded-xl border border-border p-3 text-sm space-y-1"><strong>Separate Workers integration · thetradehq</strong><p className="text-xs text-muted-foreground">{deploymentChecks?.worker ? (deploymentChecks.worker.conclusion || deploymentChecks.worker.status) : "Unavailable / not reported"} · Not a substitute for the Pages check</p>{deploymentChecks?.worker?.details_url && <a className={linkStyle} href={deploymentChecks.worker.details_url} target="_blank" rel="noopener noreferrer">Worker build evidence ↗</a>}</div>
          </div>
          <h3 className="text-sm font-semibold">Recent workflow jobs</h3>
          <p className="text-xs text-muted-foreground">Latest two runs for each agent workflow. Includes failures and skipped jobs; older history is available on GitHub. A missing failure here does not imply there has never been one.</p>
          {jobHistoryError && <p className="text-xs text-amber-400">{jobHistoryError}</p>}
          {jobHistory.length ? <div className="divide-y divide-border rounded-xl border border-border">{jobHistory.map(job => <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <div><strong>{job.workflow} · {job.name}</strong><p className="text-xs text-muted-foreground">{job.started_at ? new Date(job.started_at).toLocaleString() : "Start time unavailable"} · <span className={job.conclusion === "failure" ? "text-amber-400" : ""}>{job.conclusion || job.status || "Unknown"}</span></p></div>
            <a href={job.html_url || ("https://github.com/" + repo + "/actions/runs/" + job.runId)} target="_blank" rel="noopener noreferrer" className={linkStyle}>Logs and retry options ↗</a>
          </div>)}</div> : <p className="text-sm text-muted-foreground">No job-level records available for inspection.</p>}
          <p className="text-xs text-muted-foreground">To rerun failed jobs, open the GitHub run and use its authorized Re-run jobs control. No automatic repair is triggered from this dashboard.</p>
          <h3 className="text-sm font-semibold">Backend content-generation runs</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border p-4 space-y-2">
              <h4 className="text-sm font-semibold">Course drafting</h4>
              <p className="text-xs text-muted-foreground">Status: {courseStatus ? (courseStatus.enabled ? "Enabled" : "Paused") : "Unavailable"} · Last completed attempt: {courseStatus?.lastFinished ? new Date(courseStatus.lastFinished).toLocaleString() : "Not reported"}</p>
              {courseStatus?.runs?.length ? <div className="space-y-1">{courseStatus.runs.map((item, index) => <p key={item.period + "-" + item.slot + "-" + index} className="text-xs">{item.period || "Period unknown"} · Slot {item.slot ?? "?"}: <strong>{item.status || "Unknown"}</strong>{item.last_error ? " · " + item.last_error : ""}</p>)}</div> : <p className="text-xs text-muted-foreground">No worker run records available from the admin API.</p>}
              <Link className={linkStyle} to="/admin/courses">Open editorial approvals →</Link>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <h4 className="text-sm font-semibold">Daily question-bank regeneration</h4>
              <p className="text-xs text-muted-foreground">Status: {daily ? (daily.enabled ? "Enabled" : "Paused") : "Unavailable"} · Next preparation: {daily?.prepareAfter || "Not reported"} · Next due: {daily?.nextDue || "Not reported"}</p>
              <p className="text-xs text-muted-foreground">Current cycle: {daily ? (daily.completed ?? "?") + "/50 exercises, " + (daily.attempts ?? "?") + " attempts" : "Unavailable"} · Last completed attempt: {daily?.lastFinished ? new Date(daily.lastFinished).toLocaleString() : "Not reported"}</p>
              {daily?.lastError && <p className="text-xs text-amber-400">{daily.lastError}</p>}
              <Link className={linkStyle} to="/admin/daily">Inspect bank and settings →</Link>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4 space-y-2">
            <h3 className="font-semibold text-sm">Independent repair review and learning evidence</h3>
            <p className="text-sm">Latest collector workflow: <strong>{collectorRun ? collectorRun.conclusion || collectorRun.status : 'Unavailable'}</strong></p>
            {collectorRun && <p className="text-xs text-muted-foreground">{new Date(collectorRun.created_at).toLocaleString()}{collectorRun.head_sha ? ' · Commit ' + collectorRun.head_sha.slice(0, 12) : ''}</p>}
            <p className="text-xs text-muted-foreground">Open the collector evidence for its identity result, incident handoff, learning abstention and confirmed outcomes. Workflow success alone does not prove training or a successful repair.</p>
            <a className={linkStyle} href={collectorRun?.html_url || ('https://github.com/' + repo + '/actions/workflows/tradehq-verified-evidence.yml')} target="_blank" rel="noopener noreferrer">Inspect independent evidence ↗</a>
            <Link className={linkStyle} to="/admin/ai">Owner repair controls →</Link>
          </div>
          <h3 className="text-sm font-semibold">Open AI code proposals</h3>
          {agentError ? <p className="text-sm text-muted-foreground">Queue may be incomplete while GitHub API reporting is unavailable.</p> : proposals.length ? <div className="space-y-2">{proposals.map(pr => <a key={pr.number} href={pr.html_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-border px-4 py-3 text-sm hover:border-primary/40">#{pr.number} {pr.title} <span className="text-xs text-muted-foreground">· {pr.draft ? "Draft" : "Open"} · Inspect recorded owner decision and exact-commit checks ↗</span></a>)}</div> : <p className="text-sm text-muted-foreground">No matching open AI proposals returned.</p>}
          <p className="text-xs text-muted-foreground">No automatic merges, production deployments, sensitive database changes or privileged agent repairs are enabled by this dashboard.</p>
        </section>
        <section className={card}>
          <div className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-primary"/><h2 className="font-semibold">Monthly AI improvement ideas</h2></div>
          <p className="text-sm text-muted-foreground">Historical open and closed idea reports from the latest 100 GitHub issues (not a complete archive). Two free-tier Gemini suggestions may be drafted each month. Ideas are proposals, not deployed features.</p>
          {ideas.length ? ideas.map(item => <a key={item.id} href={item.html_url} target="_blank" rel="noopener noreferrer" className="block border border-border rounded-xl p-3 text-sm hover:border-primary/40">{item.title} <ExternalLink className="w-3 h-3 inline"/></a>) : <p className="text-sm text-muted-foreground">No monthly idea report has been published by the workflow yet.</p>}
        </section>
        <section className={card}>
          <div className="flex items-center gap-3"><Wrench className="w-5 h-5 text-primary"/><h2 className="font-semibold">Development and validation tools</h2></div>
          <p className="text-sm text-muted-foreground">Code-changing assistants must work on branches, pass checks, and produce reviewable pull requests. An AI issue-to-PR coding assistant can propose limited frontend edits without deploying. Use the AI development desk to submit requests and review proposals; approval is always manual.</p>
          <div className="flex flex-wrap gap-x-7 gap-y-3"><Link className={linkStyle} to="/admin/ai"><Bot className="w-4 h-4"/>AI development desk</Link><Link className={linkStyle} to="/admin/validator"><CheckCircle2 className="w-4 h-4"/>Internal link validator</Link><Link className={linkStyle} to="/admin/seo-audit">SEO audit utility</Link><Link className={linkStyle} to="/admin/editor">Legacy editor (opens Courses)</Link><a className={linkStyle} href={"https://github.com/" + repo + "/pulls"} target="_blank" rel="noopener noreferrer">Review code proposals ↗</a></div>
        </section>
      </>}
    </div>
  </main>;
}
