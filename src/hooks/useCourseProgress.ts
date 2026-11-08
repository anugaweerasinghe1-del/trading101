import { useEffect, useState } from "react";
import { COURSE_PROGRESS_EVENT, COURSE_PROGRESS_KEY, loadProgress } from "@/lib/courseProgress";

export function useCourseProgress() {
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    const refresh = () => setProgress(loadProgress());
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === COURSE_PROGRESS_KEY) refresh();
    };

    window.addEventListener(COURSE_PROGRESS_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    refresh();

    return () => {
      window.removeEventListener(COURSE_PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return progress;
}
