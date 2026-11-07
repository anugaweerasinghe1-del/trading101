import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrophyCollection } from "./TrophyCollection";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  FOUNDATIONS_COURSES, FOUNDATIONS_FINAL_CASE, FOUNDATIONS_VERSION,
  type GradedFoundationsAttempt, type getFoundationsEligibility,
} from "../../../supabase/functions/_shared/foundationsProgramme";
import type { publicFoundationsAssessment } from "../../../supabase/functions/_shared/foundationsAssessment";

const checkpointLabels: Record<string, string> = {
  markets: "Markets and instruments",
  execution: "Order execution",
  quotes: "Quote provenance and freshness",
  risk: "Downside and risk",
  sizing: "Position sizing",
  reflection: "Practice and reflection",
  [FOUNDATIONS_FINAL_CASE]: "Final case",
};
const readingLinks = {
  "market-and-orders": ["/wiki/limit-order-vs-market-order", "Review order types"],
  "reading-prices": ["/learn-trading-guide", "Open the learning guide"],
  "risk-and-position-sizing": ["/wiki/risk-reward-ratio", "Review risk and reward"],
  "practice-and-reflection": ["/start", "Open the guided practice journey"],
} as const;

async function request<T>(accessToken: string, body: Record<string, unknown>, signal?: AbortSignal) {
  const { data, error } = await supabase.functions.invoke<T>("foundations-certificate", {
    body, headers: { Authorization: "Bearer " + accessToken }, signal,
  });
  if (error || !data) throw Error("The Foundations service is temporarily unavailable.");
  return data;
}

type Progress = ReturnType<typeof getFoundationsEligibility> & { status: string; programmeVersion: string };
type Assessment = ReturnType<typeof publicFoundationsAssessment>;

export function FoundationsProgrammePanel() {
  const { user, session, loading } = useAuth();
  return (
    <section className="mb-10 space-y-4" aria-labelledby="foundations-programme-title">
      <div>
        <h2 id="foundations-programme-title" className="text-2xl font-bold tracking-tight">The Trade HQ Foundations programme</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Four short courses and a final case. Your scored checkpoints are private to your account.
        </p>
      </div>
      {loading ? <p role="status">Checking your account…</p> :
        user && session?.user.id === user.id ?
          <Programme key={user.id} userId={user.id} token={session.access_token} /> :
          <>
            <Link to="/auth" className="text-sm font-medium text-primary underline underline-offset-4">Sign in to take a scored checkpoint</Link>
            <TrophyCollection />
          </>}
    </section>
  );
}

function Programme({ userId, token }: { userId: string; token: string }) {
  const queryClient = useQueryClient();
  const [openCheckpoint, setOpenCheckpoint] = useState<string | null>(null);
  const progressKey = ["foundations-programme", userId];
  const progress = useQuery({
    queryKey: progressKey,
    queryFn: async ({ signal }) => {
      const snapshot = await request<Progress>(token, { action: "progress" }, signal);
      if (snapshot.status !== "available" || snapshot.programmeVersion !== FOUNDATIONS_VERSION
          || !Array.isArray(snapshot.passedCheckpoints) || !Array.isArray(snapshot.completedCourses)
          || !Array.isArray(snapshot.milestones) || typeof snapshot.perfectSizing !== "boolean") {
        throw Error("Foundations progress unavailable.");
      }
      return snapshot;
    },
    retry: false,
    refetchOnMount: "always",
    gcTime: 0,
  });
  const passed = progress.isError ? undefined : progress.data?.passedCheckpoints;
  const completed = progress.isError ? undefined : progress.data?.completedCourses;
  return (
    <>
      {progress.isPending && <p role="status">Checking Foundations progress…</p>}
      {progress.isError && <p role="status" className="text-sm">
        Foundations progress is temporarily unavailable. <button className="underline" onClick={() => void progress.refetch()}>Retry</button>
      </p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {FOUNDATIONS_COURSES.map(course => (
          <Card key={course.id} className="p-4">
            <h3 className="font-semibold">{course.title}</h3>
            <p className="text-sm text-muted-foreground">
              {completed?.includes(course.id) ? "Course completed" : "Score 4/5 on each required checkpoint."}
            </p>
            <Link className="text-sm text-primary underline underline-offset-4" to={readingLinks[course.id][0]}>{readingLinks[course.id][1]}</Link>
            <div className="mt-3 flex flex-wrap gap-2">
              {course.checkpoints.map(id => <Button key={id} size="sm" variant="outline" className="h-auto whitespace-normal"
                onClick={() => setOpenCheckpoint(id)}>{checkpointLabels[id]}{passed?.includes(id) ? " · Passed" : ""}</Button>)}
            </div>
          </Card>
        ))}
      </div>
      <Button variant="outline" onClick={() => setOpenCheckpoint(FOUNDATIONS_FINAL_CASE)}>
        {progress.data?.finalCasePassed && !progress.isError ? "Final case · Passed" : "Open final case · 8/10 to pass"}
      </Button>
      {openCheckpoint && <Checkpoint key={openCheckpoint} id={openCheckpoint} userId={userId} token={token}
        refresh={() => void queryClient.invalidateQueries({ queryKey: progressKey })}
        close={() => setOpenCheckpoint(null)} />}
      <TrophyCollection progress={progress.isError ? undefined : progress.data} checking={progress.isPending} />
    </>
  );
}

function Checkpoint({ id, userId, token, refresh, close }: {
  id: string; userId: string; token: string; refresh: () => void; close: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const submitting = useRef(false);
  const query = useQuery({
    queryKey: ["foundations-assessment", userId, id],
    queryFn: async ({ signal }) => {
      const result = await request<{ assessment: Assessment; status: string }>(token,
        { action: "assessment", programmeVersion: FOUNDATIONS_VERSION, assessmentId: id }, signal);
      if (result.status !== "available" || result.assessment?.assessmentId !== id
          || result.assessment.programmeVersion !== FOUNDATIONS_VERSION || !Array.isArray(result.assessment.questions)) {
        throw Error("This checkpoint is unavailable.");
      }
      return result.assessment;
    },
    retry: false,
    gcTime: 0,
  });
  const grade = useMutation({
    mutationFn: async (selected: number[]) => {
      const result = await request<{ grade: GradedFoundationsAttempt; status: string }>(token,
        { action: "grade", programmeVersion: FOUNDATIONS_VERSION, assessmentId: id, answers: selected });
      if (result.status !== "graded" || result.grade?.assessmentId !== id || result.grade.programmeVersion !== FOUNDATIONS_VERSION) {
        throw Error("The checkpoint result is unavailable.");
      }
      return result.grade;
    },
    onSuccess: refresh,
    onSettled: () => { submitting.current = false; },
  });
  const questions = query.data?.questions ?? [];
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{query.data?.title ?? checkpointLabels[id]}</h3>
        <Button type="button" variant="ghost" onClick={close}>Close checkpoint</Button>
      </div>
      {query.isPending && <p role="status">Loading questions…</p>}
      {query.isError && <p role="status" className="text-sm">This checkpoint is temporarily unavailable.{" "}
        <button className="underline" onClick={() => void query.refetch()}>Retry</button></p>}
      {query.data && !query.isError && <form className="mt-4 space-y-4" onSubmit={event => {
        event.preventDefault();
        if (submitting.current || Object.keys(answers).length !== questions.length) return;
        submitting.current = true;
        grade.mutate(questions.map((_, index) => answers[index]));
      }}>
        {query.data.caseDescription && <p className="text-sm">{query.data.caseDescription}</p>}
        {questions.map((question, index) => <fieldset key={index} disabled={grade.isPending} className="space-y-1 rounded-xl border p-3">
          <legend className="px-1 font-medium">{index + 1}. {question.prompt}</legend>
          {question.choices.map((choice, choiceIndex) => <label key={choiceIndex} className="flex items-start gap-2 py-1 text-sm">
            <input className="mt-1" type="radio" name={"foundations-" + index} required checked={answers[index] === choiceIndex}
              onChange={() => { grade.reset(); setAnswers(previous => ({ ...previous, [index]: choiceIndex })); }} />
            {choice}
          </label>)}
        </fieldset>)}
        <Button type="submit" disabled={grade.isPending || Object.keys(answers).length !== questions.length}>
          {grade.isPending ? "Scoring…" : "Submit answers"}
        </Button>
        {grade.isSuccess && <p role="status">Score {grade.data.points}/{grade.data.possible}. {grade.data.points >= grade.data.possible * 0.8 ? "Passed." : "Keep practising and try again when ready."}</p>}
        {grade.isError && <p role="alert">Your result could not be confirmed. Your selected answers are still here.</p>}
      </form>}
    </Card>
  );
}
