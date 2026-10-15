export interface DailyGenerationStatus {
  enabled: boolean; nextDue: string; prepareAfter: string; completed: number; attempts: number;
  retryAfter?: string | null; lastError?: string | null; lastStarted?: string | null; lastFinished?: string | null;
  freeConfirmed: boolean; hasApiKey: boolean; model: string;
}

/** Operator guidance only. The server still owns leases, cooldowns and budgets. */
export function dailyGenerationReadiness(status: DailyGenerationStatus, now = Date.now()) {
  if (!status.enabled) return { available: false, message: 'Generation is paused. Enable it before requesting a part.' };
  if (!status.hasApiKey || !status.freeConfirmed) return { available: false, message: 'Complete free-tier setup in course settings. No generation request will be sent.' };
  if (status.attempts >= 3) return { available: false, message: 'This part has reached its three-attempt limit. It remains paused until the next preparation cycle; approved practice continues.' };
  if (status.retryAfter) {
    const retry = Date.parse(status.retryAfter);
    if (!Number.isFinite(retry)) return { available: false, message: 'Retry time is unavailable. Refresh status before requesting a part.' };
    if (retry > now) return { available: false, message: `Cooling down for about ${Math.ceil((retry - now) / 60000)} more minutes. No retry request will be sent.` };
  }
  if (status.lastStarted && Date.parse(status.lastStarted) > now - 120000)
    return { available: false, message: 'A part started recently. Wait two minutes from its start before requesting another.' };
  return { available: true, message: status.attempts === 2
    ? 'One attempt remains for this part. Requesting it uses the existing free-tier budget; success is not guaranteed.'
    : 'You can request the next part. The server checks the active lease and remaining budget before queuing it.' };
}
