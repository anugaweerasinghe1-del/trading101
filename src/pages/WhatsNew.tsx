import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MegaFooter } from "@/components/MegaFooter";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE_DOMAIN } from "@/lib/constants";
import { readPublicCoursePublications } from "@/lib/publicCoursePublications";
import { APPROVED_RELEASES, publishedCourseRelease, RELEASE_NOTES, releaseNoticesDisabled, setReleaseNoticesDisabled, type ReleaseNote } from "@/lib/releaseNotes";

const TITLE = "What’s New | TradeHQ";
const DESCRIPTION = "See the latest TradeHQ improvements, newly published courses, and Trophy Cabinet updates.";
const dateLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Colombo",
});

export default function WhatsNew() {
  const [noticesDisabled, setNoticesDisabled] = useState(releaseNoticesDisabled);
  const [preferenceFailed, setPreferenceFailed] = useState(false);
  const courses = useQuery({
    queryKey: ["whats-new-course-publications"],
    staleTime: 30_000,
    refetchInterval: 45_000,
    retry: 1,
    queryFn: async ({ signal }): Promise<ReleaseNote[]> => {
      const { data, error } = await readPublicCoursePublications({ signal });
      if (error || !Array.isArray(data)) throw new Error("Course updates are unavailable.");
      return data.map(publishedCourseRelease).filter((release): release is ReleaseNote => release !== null);
    },
  });
  const updates = [...APPROVED_RELEASES, ...RELEASE_NOTES, ...(courses.data ?? [])]
    .sort((first, second) => Date.parse(second.date) - Date.parse(first.date));

  return (
    <>
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={`${SITE_DOMAIN}/whats-new`} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={`${SITE_DOMAIN}/whats-new`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
          <header className="mb-10 border-b border-border pb-8">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles aria-hidden="true" className="h-4 w-4" /> TradeHQ updates
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">What’s New</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">{DESCRIPTION}</p>
            <Link to="/roadmap" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">
              See what’s planned on the Roadmap <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <label className="mt-2 flex min-h-11 w-fit items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={noticesDisabled} onChange={event => {
                const disabled = event.currentTarget.checked;
                const saved = setReleaseNoticesDisabled(disabled);
                setPreferenceFailed(!saved);
                if (saved) setNoticesDisabled(disabled);
              }} />
              Hide release announcements on this browser
            </label>
            {preferenceFailed && <p role="status" className="text-sm text-muted-foreground">This browser couldn’t save your announcement preference.</p>}
          </header>

          {courses.isError && (
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground" role="status">
              Course updates are temporarily unavailable.
              <Button size="sm" variant="outline" disabled={courses.isFetching} onClick={() => void courses.refetch()}>
                Retry course updates
              </Button>
            </div>
          )}

          <ol aria-label="TradeHQ releases" className="space-y-4">
            {updates.map(update => (
              <li key={update.id}>
                <Card className="p-5 sm:p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{update.category}</Badge>
                    <time dateTime={update.date}>{dateLabel.format(new Date(update.date))}</time>
                  </div>
                  <h2 className="break-words text-lg font-semibold tracking-tight sm:text-xl">{update.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{update.summary}</p>
                  <Link to={update.href} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    {update.action} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Card>
              </li>
            ))}
          </ol>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
