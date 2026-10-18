import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { courseTracks, getTrack, type CourseTrack } from "@/lib/coursesData";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";
import { validateCourseDocument } from "../../supabase/functions/_shared/courseDocument";
import { applyCourseEditorialCorrections } from "@/lib/courseEditorialCorrections";

const reader = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
export function useCourseCatalog() {
  const query = useQuery({
    queryKey: ["approved-course-catalog"], staleTime: 60000, retry: 1,
    queryFn: async (): Promise<CourseTrack[]> => {
      const { data, error } = await reader.rpc("get_published_course_catalog");
      if (error) throw error;
      return (data ?? []).flatMap(doc => validateCourseDocument(doc).length ? [] : [applyCourseEditorialCorrections(doc as CourseTrack)]);
    },
  });
  return { ...query, tracks: [...courseTracks, ...(query.data ?? [])] };
}

function bootstrapCourse(slug: string): CourseTrack | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.document.getElementById("approved-course-bootstrap")?.textContent;
    const doc = raw ? JSON.parse(raw) : null;
    return doc?.slug === slug && !validateCourseDocument(doc).length ? applyCourseEditorialCorrections(doc as CourseTrack) : undefined;
  } catch { return undefined; }
}
export function useCourseDocument(slug: string | undefined) {
  const existing = slug ? getTrack(slug) : undefined;
  const query = useQuery({
    queryKey: ["approved-course", slug], enabled: !!slug && !existing, staleTime: 60000, retry: 1,
    placeholderData: slug ? bootstrapCourse(slug) : undefined,
    queryFn: async (): Promise<CourseTrack | null> => {
      const { data, error } = await reader.from("published_courses").select("document").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data && !validateCourseDocument(data.document).length ? applyCourseEditorialCorrections(data.document as CourseTrack) : null;
    },
  });
  return { ...query, track: existing ?? query.data };
}
