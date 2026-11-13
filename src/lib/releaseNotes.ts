import approvedReleases from "../content/releases/approved.json";

export type ReleaseNote = {
  id: string;
  date: string;
  category: "Site" | "Learning" | "Rewards" | "Portfolio" | "Course";
  title: string;
  summary: string;
  href: `/${string}`;
  action: string;
};

const ARCHIVED_RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    id: "whats-new",
    date: "2026-11-09",
    category: "Site",
    title: "A home for TradeHQ updates",
    summary: "Find recent improvements and newly published courses in one place. The Roadmap is still where you can see what we’re working on next.",
    href: "/roadmap",
    action: "See the Roadmap",
  },
  {
    id: "daily-to-next-lesson",
    date: "2026-11-09",
    category: "Learning",
    title: "Go from Daily Practice to your next lesson",
    summary: "Finish a daily challenge to see your next approved lesson. You can keep learning right away or return tomorrow. Lessons now offer help from the learning mentor before the quiz.",
    href: "/daily",
    action: "Open Daily Practice",
  },
  {
    id: "portfolio-chart",
    date: "2026-11-08",
    category: "Portfolio",
    title: "A clearer view of your practice portfolio",
    summary: "The portfolio chart shows your current account value even before a trend has formed. Axis labels and the downside comparison are easier to read.",
    href: "/portfolio",
    action: "Open your portfolio",
  },
  {
    id: "trophy-cabinet",
    date: "2026-11-08",
    category: "Rewards",
    title: "Twenty trophies for learning and practice",
    summary: "The Trophy Cabinet explains what earns each award and shows your progress. Earned trophies are private by default, with separate controls for anything you choose to share.",
    href: "/achievements",
    action: "Explore the Trophy Cabinet",
  },
];

// Approved entries ship with the production build. Routine deploys add none.
export const APPROVED_RELEASES = approvedReleases as readonly (ReleaseNote & { announce: boolean })[];

export const RELEASE_NOTES: readonly ReleaseNote[] = [...APPROVED_RELEASES, ...ARCHIVED_RELEASE_NOTES]
  .sort((first, second) => Date.parse(second.date) - Date.parse(first.date));

export type ReleaseCandidate = { release: ReleaseNote; marker: string };

/** Newest unseen approved announcement wins, whether it came from the build
 * manifest or the live published-course feed. Neither routine commits nor
 * unapproved course drafts enter this list. */
export function latestUnseenRelease(
  candidates: readonly ReleaseCandidate[],
  seen: Readonly<Record<string, boolean>>,
  sessionSeen: ReadonlySet<string>,
  cutoff: number,
  now: number,
): ReleaseCandidate | undefined {
  return candidates.filter(({ release, marker }) => {
    const date = Date.parse(release.date);
    return Number.isFinite(date) && date >= cutoff && date <= now
      && seen[marker] !== true && !sessionSeen.has(marker);
  }).sort((first, second) => Date.parse(second.release.date) - Date.parse(first.release.date)
    || first.marker.localeCompare(second.marker))[0];
}

export function publishedCourseRelease(row: unknown): ReleaseNote | null {
  if (!row || typeof row !== "object") return null;
  const { slug, published_at, title } = row as Record<string, unknown>;
  if (typeof slug !== "string" || slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      typeof published_at !== "string" || !Number.isFinite(Date.parse(published_at)) ||
      typeof title !== "string" || !title.trim()) return null;
  return {
    id: `course-${slug}`,
    date: published_at,
    category: "Course",
    title: title.trim(),
    summary: "A newly published course is available in the TradeHQ learning library.",
    href: `/courses/${slug}`,
    action: "Open course",
  };
}

export const RELEASE_NOTICES_PREFERENCE = "tradehq-release-notices-disabled";

export function releaseNoticesDisabled() {
  try { return localStorage.getItem(RELEASE_NOTICES_PREFERENCE) === "1"; }
  catch { return false; }
}

export function setReleaseNoticesDisabled(disabled: boolean) {
  try { localStorage.setItem(RELEASE_NOTICES_PREFERENCE, disabled ? "1" : "0"); }
  catch { return false; }
  return true;
}
