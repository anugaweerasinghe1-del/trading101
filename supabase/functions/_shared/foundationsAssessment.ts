import {
  FOUNDATIONS_COURSES, FOUNDATIONS_FINAL_CASE, FOUNDATIONS_VERSION,
  type GradedFoundationsAttempt,
} from "./foundationsProgramme.ts";

type Question = { prompt: string; choices: string[]; correctIndex: number };
type Assessment = { title: string; caseDescription?: string; questions: Question[] };

const checkpoints = new Set<string>(FOUNDATIONS_COURSES.flatMap(course => [...course.checkpoints]));
export function assessmentSize(id: unknown): number | null {
  if (id === FOUNDATIONS_FINAL_CASE) return 10;
  return typeof id === "string" && checkpoints.has(id) ? 5 : null;
}

const validText = (value: unknown, limit: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= limit;

export function parseFoundationsAssessment(input: unknown, size: number): Assessment {
  if (!input || typeof input !== "object") throw Error("Invalid reviewed assessment");
  const { title, caseDescription, questions } = input as Record<string, unknown>;
  if (!validText(title, 150) || (caseDescription !== undefined && !validText(caseDescription, 2000))
      || !Array.isArray(questions) || questions.length !== size) {
    throw Error("Invalid reviewed assessment");
  }

  const parsed = questions.map((item: unknown): Question => {
    if (!item || typeof item !== "object") throw Error("Invalid reviewed question");
    const { prompt, choices, correctIndex } = item as Record<string, unknown>;
    if (!validText(prompt, 500) || !Array.isArray(choices) || choices.length !== 4
        || !choices.every(choice => validText(choice, 300)) || new Set(choices).size !== choices.length
        || typeof correctIndex !== "number" || !Number.isInteger(correctIndex) || correctIndex < 0
        || correctIndex >= choices.length) {
      throw Error("Invalid reviewed question");
    }
    return { prompt, choices, correctIndex };
  });
  if (new Set(parsed.map(item => item.prompt)).size !== size) throw Error("Duplicate reviewed question");
  return { title, caseDescription: typeof caseDescription === "string" ? caseDescription : undefined, questions: parsed };
}

export function publicFoundationsAssessment(id: string, assessment: Assessment) {
  return {
    programmeVersion: FOUNDATIONS_VERSION, assessmentId: id,
    title: assessment.title, caseDescription: assessment.caseDescription,
    questions: assessment.questions.map(({ prompt, choices }) => ({ prompt, choices })),
  };
}

export function gradeFoundationsAssessment(id: string, assessment: Assessment, answers: unknown): GradedFoundationsAttempt | null {
  const possible = assessment.questions.length;
  if (!Array.isArray(answers) || answers.length !== possible) return null;
  let points = 0;
  for (const [index, question] of assessment.questions.entries()) {
    const answer = answers[index];
    if (!Number.isInteger(answer) || answer < 0 || answer >= question.choices.length) return null;
    if (answer === question.correctIndex) points++;
  }
  return { programmeVersion: FOUNDATIONS_VERSION, assessmentId: id, points, possible };
}
