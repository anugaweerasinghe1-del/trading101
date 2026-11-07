export const FOUNDATIONS_VERSION = "foundations-v1";

export const FOUNDATIONS_COURSES = [
  { id: "market-and-orders", title: "Markets and Orders", checkpoints: ["markets", "execution"] },
  { id: "reading-prices", title: "Reading Prices", checkpoints: ["quotes"] },
  { id: "risk-and-position-sizing", title: "Risk and Position Sizing", checkpoints: ["risk", "sizing"] },
  { id: "practice-and-reflection", title: "Practice and Reflection", checkpoints: ["reflection"] },
] as const;

export const FOUNDATIONS_FINAL_CASE = "final-case";
export type CertificateMilestone = "first-course" | "core-studies" | "foundations";

/** Only call this policy with authenticated account-scoped, server-graded records.
 * Browser progress, user-supplied scores and other programme versions cannot issue awards.
 */
export type GradedFoundationsAttempt = Readonly<{
  programmeVersion: string;
  assessmentId: string;
  points: number;
  possible: number;
}>;

const knownCheckpoints = new Set<string>(FOUNDATIONS_COURSES.flatMap(course => [...course.checkpoints]));

export function getFoundationsEligibility(attempts: readonly GradedFoundationsAttempt[]) {
  const passedCheckpoints = new Set<string>();
  let finalCasePassed = false;
  let perfectSizing = false;

  for (const attempt of attempts) {
    if (attempt.programmeVersion !== FOUNDATIONS_VERSION ||
        !Number.isSafeInteger(attempt.points) || attempt.points < 0 ||
        attempt.points > attempt.possible) continue;

    if (attempt.assessmentId === FOUNDATIONS_FINAL_CASE) {
      if (attempt.possible === 10 && attempt.points >= 8) finalCasePassed = true;
    } else if (knownCheckpoints.has(attempt.assessmentId) && attempt.possible === 5 && attempt.points >= 4) {
      passedCheckpoints.add(attempt.assessmentId);
      if (attempt.assessmentId === "sizing" && attempt.points === 5) perfectSizing = true;
    }
  }

  const completedCourses = FOUNDATIONS_COURSES.filter(course =>
    course.checkpoints.every(checkpoint => passedCheckpoints.has(checkpoint)),
  ).map(course => course.id);

  const milestones: CertificateMilestone[] = [];
  if (completedCourses.length >= 1) milestones.push("first-course");
  if (completedCourses.length >= 3) milestones.push("core-studies");
  if (completedCourses.length === FOUNDATIONS_COURSES.length && finalCasePassed) {
    milestones.push("foundations");
  }

  return { completedCourses, finalCasePassed, milestones, perfectSizing, passedCheckpoints: [...passedCheckpoints] };
}
