import { getQuestions, Question } from "@/lib/questionService";
import { DuplicateMode } from "@/types/questionImport";

export function getDuplicateKey(
  question: Pick<Question, "subject" | "topic" | "questionText" | "questionImage">,
  mode: DuplicateMode
) {
  if (mode === "disable") return crypto.randomUUID();

  if (mode === "questionTextOnly") {
    return question.questionText.trim().toLowerCase();
  }

  if (mode === "questionImage") {
    return question.questionImage.trim().toLowerCase();
  }

  return `${question.subject.trim().toLowerCase()}|${question.topic
    .trim()
    .toLowerCase()}|${question.questionText.trim().toLowerCase()}`;
}

export async function getExistingDuplicateKeys(mode: DuplicateMode) {
  const questions = await getQuestions(true);

  return new Set(
    questions.map((question) => getDuplicateKey(question, mode))
  );
}