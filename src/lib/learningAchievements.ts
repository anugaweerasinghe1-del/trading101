import type { CourseProgressState } from "./courseProgress";
import type { CourseTrack } from "./coursesData";

export type TrophyCatalogTrack = Pick<CourseTrack, "slug" | "title" | "badge" | "lessons">;

export type PersonalMilestone = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  current: number;
  target: number;
};

export type PersonalCourseBadge = {
  slug: string;
  title: string;
  name: string;
  total: number;
  done: number;
  complete: boolean;
  previouslyRecorded: boolean;
};

/**
 * A read-only reflection of learner-controlled progress, NEVER a public
 * attestation. In particular, badgeEarnedAt, completedAt and quiz scores may
 * be edited in browser storage and must not be submitted as a verified award.
 */
export function buildPersonalTrophyCabinet(
  catalog: TrophyCatalogTrack[],
  progress: CourseProgressState,
) {
  const known = new Set<string>();
  const badges: PersonalCourseBadge[] = [];
  let completedLessons = 0;
  let availableLessons = 0;
  let completedCourses = 0;

  for (const track of catalog) {
    if (!track || typeof track.slug !== "string" || known.has(track.slug)) continue;
    known.add(track.slug);
    const lessons = [...new Set(track.lessons.map(lesson => lesson.slug).filter(Boolean))];
    if (lessons.length === 0) continue;
    const recorded = progress.tracks[track.slug];
    const done = lessons.filter(slug => recorded?.lessons[slug]?.status === "completed").length;
    const complete = done === lessons.length;
    if (complete) completedCourses++;
    completedLessons += done;
    availableLessons += lessons.length;
    badges.push({
      slug: track.slug,
      title: track.title,
      name: track.badge.name,
      total: lessons.length,
      done,
      complete,
      // Legacy badge timestamps remain visible as a private historical record
      // but cannot alone satisfy even the personal completion calculation.
      previouslyRecorded: Boolean(recorded?.badgeEarnedAt),
    });
  }
  const archivedBadgeCount = Object.entries(progress.tracks).filter(
    ([slug, item]) => !known.has(slug) && Boolean(item?.badgeEarnedAt),
  ).length;
  const specs = [
    ["first-lesson", "First Steps", "Finish your first structured lesson.", completedLessons, 1],
    ["five-lessons", "Curious Learner", "Finish five different structured lessons.", completedLessons, 5],
    ["ten-lessons", "Knowledge Builder", "Finish ten different structured lessons.", completedLessons, 10],
    ["first-course", "Course Graduate", "Complete every lesson in one structured course.", completedCourses, 1],
    ["three-courses", "Learning Explorer", "Complete three different structured courses.", completedCourses, 3],
  ] as const;
  const milestones: PersonalMilestone[] = specs.map(([id, title, description, current, target]) => ({
    id, title, description, current: Math.min(current, target), target, earned: current >= target,
  }));
  return {
    milestones,
    badges,
    completedLessons,
    availableLessons,
    completedCourses,
    archivedBadgeCount,
    milestonesEarned: milestones.filter(m => m.earned).length,
  };
}
