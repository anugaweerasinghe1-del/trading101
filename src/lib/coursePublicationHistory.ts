/** Recover browser-only announcement history without trusting stored JSON shapes. */
export function readCoursePublicationHistory(raw: string | null, now = Date.now()): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(raw || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([marker, seen]) => {
      const split = marker.indexOf(':');
      const stamp = split > 0 ? Date.parse(marker.slice(split + 1)) : NaN;
      return seen === true && Number.isFinite(stamp) && stamp <= now + 60000 && now - stamp < 30 * 86400000;
    }).slice(-150));
  } catch { return {}; }
}
