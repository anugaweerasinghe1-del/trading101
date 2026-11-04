/** Fence responses to the in-memory admin key/session that requested them.
 * A local guard complements server authorization; it never grants access. */
export class AdminRequestCancelled extends Error {
  constructor() { super('Administration session changed.'); }
}
export const isAdminRequestCancelled = (error: unknown) => error instanceof AdminRequestCancelled;
export function createAdminRequestScope() {
  let key = '', generation = 0, active = true;
  const reads = new Map<string, number>();
  return {
    setKey(next: string) { if (key !== next) { key = next; generation++; reads.clear(); } },
    invalidate() { generation++; reads.clear(); },
    activate() { active = true; },
    dispose() { active = false; generation++; reads.clear(); },
    capture(expectedKey: string, channel?: string) {
      const epoch = generation;
      const version = channel ? (reads.get(channel) ?? 0) + 1 : 0;
      if (channel) reads.set(channel, version);
      const current = () => active && !!expectedKey && key === expectedKey && generation === epoch &&
        (!channel || reads.get(channel) === version);
      return { current, assert() { if (!current()) throw new AdminRequestCancelled(); } };
    },
  };
}
