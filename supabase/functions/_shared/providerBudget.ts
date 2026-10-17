/** Atomic, shared upstream limits for the two configured traditional quote providers.
 * These are conservative operational ceilings, NOT verified provider quota headroom.
 * All Edge callers share the same HMAC-pseudonymised DB buckets.
 */
export type TraditionalProvider = 'Polygon' | 'Alpha Vantage';
type Limiter = (subject: string, bucket: string, seconds: number, max: number) => Promise<boolean>;
const limits: Record<TraditionalProvider, { key: string; minute: number; day: number }> = {
  Polygon: { key: 'polygon', minute: 4, day: 20 },
  'Alpha Vantage': { key: 'alpha-vantage', minute: 4, day: 20 },
};
/** False means no upstream request. Limiter errors must propagate (fail closed). */
export async function traditionalProviderBudget(provider: TraditionalProvider, limit: Limiter): Promise<boolean> {
  const policy = limits[provider];
  if (!policy) throw new Error('Unknown quote provider');
  const subject = 'tradehq-traditional-provider-global';
  if (!await limit(subject, 'upstream-' + policy.key + '-day', 86400, policy.day)) return false;
  return await limit(subject, 'upstream-' + policy.key + '-minute', 60, policy.minute);
}
