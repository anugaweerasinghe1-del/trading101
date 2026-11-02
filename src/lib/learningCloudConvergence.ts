import { mergeCourseRecords, mergeJourneyRecords } from "./learningCloudMerge";
import { parseCourseProgress, type CourseProgressState } from "./courseProgress";
import { parseJourneyProgress, type BeginnerJourneyProgress } from "./beginnerJourney";

export type LearningState = { courses: CourseProgressState; journey: BeginnerJourneyProgress };
export type LearningRow = { courses: unknown; journey: unknown; updated_at: string };
export type LearningIO = {
  read: () => Promise<LearningRow | null>;
  insert: (state: LearningState) => Promise<boolean>;
  updateIfUnchanged: (state: LearningState, expectedUpdatedAt: string) => Promise<boolean>;
};

export function learningStable(value: unknown): string {
  return JSON.stringify(value, (_key, part) =>
    part && typeof part === "object" && !Array.isArray(part)
      ? Object.fromEntries(Object.entries(part).sort(([a],[b]) => a.localeCompare(b)))
      : part);
}

/** Retrying compare-and-swap prevents two devices saving different lessons from
 * overwriting one another. Each retry reads the newest server state and merges
 * it with the caller's *current* browser progress, not a stale captured copy.
 * No user-profile or verified-practice fields are ever written here.
 */
export async function convergeLearningProgress(
  currentLocal: () => LearningState,
  io: LearningIO,
  stillActive: () => boolean,
  maxAttempts = 5,
): Promise<LearningState> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (!stillActive()) throw new Error("Learning session changed during synchronization.");
    const remote = await io.read();
    if (!stillActive()) throw new Error("Learning session changed during synchronization.");
    const local = currentLocal();
    const remoteCourses = remote ? parseCourseProgress(JSON.stringify(remote.courses)) : local.courses;
    const remoteJourney = remote ? parseJourneyProgress(remote.journey) : local.journey;
    const merged = {
      courses: mergeCourseRecords(local.courses, remoteCourses),
      journey: mergeJourneyRecords(local.journey, remoteJourney),
    };
    if (remote && learningStable(remoteCourses) === learningStable(merged.courses)
      && learningStable(remoteJourney) === learningStable(merged.journey)) return merged;
    if (!stillActive()) throw new Error("Learning session changed during synchronization.");
    const committed = remote
      ? await io.updateIfUnchanged(merged, remote.updated_at)
      : await io.insert(merged);
    if (committed) return merged;
    // A concurrent writer won. Re-read and merge instead of overwriting it.
  }
  throw new Error("Learning progress changed on another device; retry synchronization.");
}
