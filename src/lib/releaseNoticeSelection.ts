/** Pick the newest reviewed, publicly available release for one browser.
 * The caller supplies only approved feature entries and published courses.
 * This helper does not access any analytics, accounts, or private data.
 */
export type ReleaseCandidate<T extends { date: string } = { date: string }> = {
  release: T;
  marker: string;
};

export function latestUnseenRelease<T extends ReleaseCandidate>(
  candidates: readonly T[],
  seen: Readonly<Record<string, boolean>>,
  sessionSeen: ReadonlySet<string>,
  cutoff: number,
  now: number,
): T | undefined {
  return candidates.filter(({ release, marker }) => {
    const date = Date.parse(release.date);
    return Number.isFinite(date) && date >= cutoff && date <= now
      && seen[marker] !== true && !sessionSeen.has(marker);
  }).sort((first, second) => Date.parse(second.release.date) - Date.parse(first.release.date)
    || first.marker.localeCompare(second.marker))[0];
}
