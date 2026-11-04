import { useEffect, useRef, useState } from "react";
import { CourseField } from "./CourseDraftEditor";

export interface GenerationSettings {
  enabled: boolean; freeConfirmed: boolean; model: string; hasApiKey: boolean; hasGscCredentials: boolean;
  gscProperty: string; topicRequests: string[]; lastStarted: string | null; lastFinished: string | null;
  runs: { period: string; slot: number; status: string; attempts: number; last_error: string | null }[];
}
export function CourseGenerationSettings({ settings, busy, save, generate, onDirtyChange }: {
  settings: GenerationSettings; busy: boolean; onDirtyChange?: (dirty: boolean) => void;
  save: (values: Record<string, unknown>) => Promise<boolean>; generate: () => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [confirmed, setConfirmed] = useState(settings.freeConfirmed);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(settings.model);
  const [property, setProperty] = useState(settings.gscProperty);
  const [credentials, setCredentials] = useState<Record<string, unknown> | null>(null);
  const [credentialName, setCredentialName] = useState("");
  const [topics, setTopics] = useState(settings.topicRequests.join("\n"));
  const [fileError, setFileError] = useState("");
  const signature = (values: { enabled: boolean; freeConfirmed: boolean; model: string; gscProperty: string; topicRequests: string[] }) =>
    JSON.stringify([values.enabled, values.freeConfirmed, values.model, values.gscProperty, values.topicRequests]);
  const baseline = useRef(signature(settings));
  const localValues = { enabled, freeConfirmed: confirmed, model, gscProperty: property.trim(),
    topicRequests: topics.split('\n').map(t => t.trim()).filter(Boolean).slice(0,20) };
  const dirty = !!apiKey || !!credentials || signature(localValues) !== baseline.current;
  const remoteSignature = signature(settings);
  useEffect(() => { onDirtyChange?.(dirty); return () => onDirtyChange?.(false); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (dirty || remoteSignature === baseline.current) return;
    baseline.current = remoteSignature;
    setEnabled(settings.enabled); setConfirmed(settings.freeConfirmed); setModel(settings.model);
    setProperty(settings.gscProperty); setTopics(settings.topicRequests.join('\n'));
  }, [remoteSignature, dirty, settings]);
  const submit = async () => {
    const saved = await save({ enabled, freeConfirmed: confirmed, model, apiKey: apiKey || null,
      gscProperty: property.trim(), gscCredentials: credentials,
      topicRequests: topics.split("\n").map(t => t.trim()).filter(Boolean).slice(0, 20) });
    if (saved) { baseline.current = signature(localValues); setProperty(localValues.gscProperty); setTopics(localValues.topicRequests.join("\n")); setApiKey(""); setCredentials(null); setCredentialName(""); }
  };
  return <section className="rounded-2xl border border-border p-5 sm:p-6 space-y-5">
    <div><h2 className="text-lg font-semibold">Monthly course drafts</h2><p className="text-sm text-muted-foreground mt-2">
      One draft after the 1st and one after the 15th. Courses always wait for your approval.
      Checks run daily at 09:00 Sri Lanka time; completed months use no AI requests.</p></div>
    {dirty && remoteSignature !== baseline.current && <p role="status" className="text-sm text-amber-600 dark:text-amber-400">Generation settings changed on the server. Your unsaved values are preserved; review the current schedule before saving.</p>}
    <fieldset disabled={busy} className="space-y-5">
    <div className="grid sm:grid-cols-2 gap-4">
      <label className="space-y-2 text-sm"><span className="block text-muted-foreground">Free Gemini API key {settings.hasApiKey ? "(saved securely)" : ""}</span>
        <input type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)}
          placeholder={settings.hasApiKey ? "Leave blank to keep the saved key" : "Paste a free-tier API key"}
          className="w-full rounded-xl border border-border bg-background px-3 py-2" /></label>
      <label className="space-y-2 text-sm"><span className="block text-muted-foreground">Free-tier model</span>
        <select value={model} onChange={e => setModel(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2">
          <option value="gemini-3.8-flash">Gemini 3.8 Flash</option><option value="gemini-3.5-flash">Gemini 3.5 Flash</option><option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option></select></label>
    </div>
    <p className="text-sm text-muted-foreground">Create the key in <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a> using an eligible adult account and a project with billing disabled.
      No OpenAI key or ChatGPT subscription is used. Quota errors pause generation; there is no paid fallback.</p>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
      <span>I confirm this API key belongs to a free-tier project with billing disabled.</span></label>
    <details className="rounded-xl bg-muted/20 p-4"><summary className="cursor-pointer font-medium text-sm">Connect Search Console for demand-based topics</summary>
      <div className="space-y-4 mt-4 text-sm">
        <p className="text-muted-foreground">Use a Google service account with read-only access to your TradeHQ Search Console property.
          In Search Console, add its email under Settings → Users and permissions. Upload its JSON key here; it is encrypted on the server.</p>
        <CourseField label="Search Console property" value={property} onChange={setProperty} />
        <p className="text-xs text-muted-foreground">For example: sc-domain:thetradehq.com or https://www.thetradehq.com/</p>
        <label className="block space-y-2"><span className="text-muted-foreground">Service-account JSON key {settings.hasGscCredentials ? "(saved securely)" : ""}</span>
          <input type="file" accept=".json,application/json" onChange={async e => {
            const file = e.target.files?.[0]; if (!file) return;
            try {
              if (file.size > 14000) throw new Error("Key file is too large.");
              const parsed = JSON.parse(await file.text());
              if (parsed.type !== "service_account") throw new Error("Choose a Google service-account JSON key.");
              setCredentials(parsed); setCredentialName(file.name); setFileError("");
            } catch (error) { setFileError(error instanceof Error ? error.message : "Could not read the key."); }
          }} /></label>
        {credentialName && <p className="text-primary">{credentialName} ready to save</p>}
        {fileError && <p role="alert" className="text-destructive">{fileError}</p>}
      </div>
    </details>
    <CourseField label="Topic requests — one per line (used when Search Console has no usable data)" value={topics} onChange={setTopics} multiline />
    <p className="text-xs text-muted-foreground">The draft records whether its topic came from Search Console or your requests. Search volumes are never invented.</p>
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />Enable monthly generation</label>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy || (enabled && !confirmed)} onClick={() => void submit()} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50">Save generation settings</button>
      <button type="button" disabled={busy || !settings.enabled || !settings.hasApiKey} onClick={() => void generate()} className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-50">Generate next draft</button>
    </div>
    </fieldset>
    <div className="border-t border-border pt-4 text-sm space-y-2">
      <p>Schedule: <span className="text-primary">{settings.enabled && settings.hasApiKey ? "Enabled" : "Awaiting setup"}</span></p>
      {settings.runs.map(run => <div key={run.period + run.slot} className="rounded-xl bg-muted/30 p-3">
        <p>{run.period} · Draft {run.slot} · {run.status.replace(/_/g, " ")} · {run.attempts}/3 attempts</p>
        {run.last_error && <p className="text-muted-foreground mt-1">{run.last_error}</p>}
      </div>)}
    </div>
  </section>;
}
