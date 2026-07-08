import { supabase } from "@/lib/supabaseClient";
import { Question } from "@/lib/questionService";

export type Attempt = {
  studentId: string;
  studentName: string;
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  answers: Record<string, string[]>;
  scratchpads: Record<string, string>;
  questionTimeSpent: Record<string, number>;
  questionTimeLeft: Record<string, number>;
  overallTimeLeft: number;
  questionsSnapshot: Question[];
  overallTimeSpent: number;
};

const fromDb = (row: any): Attempt => ({
  studentId: row.student_id || "",
  studentName:
    row.student_name ||
    row.profiles?.full_name ||
    row.profiles?.email ||
    "Unknown",
  id: row.id,
  examId: row.exam_id,
  examTitle: row.exam_title || "",
  score: row.score || 0,
  totalQuestions: row.total_questions || 0,
  submittedAt: row.submitted_at,
  answers: row.answers || {},
  scratchpads: row.scratchpads || {},
  questionTimeSpent: row.question_time_spent || {},
  questionTimeLeft: row.question_time_left || {},
  overallTimeLeft: row.overall_time_left || 0,
  questionsSnapshot: row.questions_snapshot || [],
  overallTimeSpent: row.overall_time_spent || 0,
});

/**
 * Submits a completed exam attempt for grading. This calls the
 * `submit_exam_attempt` Postgres function (see
 * supabase/migrations/0001_secure_exam_scoring.sql), which looks up the
 * correct answers and computes the score server-side — the client only
 * ever sends the student's raw answers and timing data, never a score.
 *
 * This replaces the old addAttempt(), which trusted a client-computed
 * `score` field and is no longer used.
 */
export async function submitExamAttempt(input: {
  examId: string;
  answers: Record<string, string[]>;
  scratchpads: Record<string, string>;
  questionTimeSpent: Record<string, number>;
  questionTimeLeft: Record<string, number>;
  overallTimeSpent: number;
  overallTimeLeft: number;
}) {
  const { data, error } = await supabase.rpc("submit_exam_attempt", {
    p_exam_id: input.examId,
    p_answers: input.answers,
    p_scratchpads: input.scratchpads,
    p_question_time_spent: input.questionTimeSpent,
    p_question_time_left: input.questionTimeLeft,
    p_overall_time_spent: input.overallTimeSpent,
    p_overall_time_left: input.overallTimeLeft,
  });

  if (error) throw error;

  return fromDb(data);
}

export async function getAttempts() {
  const { data, error } = await supabase
    .from("attempts")
    .select("*, profiles(full_name, email)")
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(fromDb);
}

export async function getAttemptsForStudent(studentId: string) {
  const { data, error } = await supabase
    .from("attempts")
    .select("*, profiles(full_name, email)")
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(fromDb);
}

export type QuestionStats = {
  timesAttempted: number;
  correctCount: number;
  maxTimeSpent: number;
  minTimeSpent: number;
};

/**
 * Aggregates every submitted attempt into per-question stats: how many times
 * a question has been attempted, how many of those were answered correctly,
 * and the fastest/slowest time a student spent on it. Used on the "Review
 * Questions" page to surface which questions are easy, hard, slow, etc.
 */
export async function getQuestionStatsMap(): Promise<Record<string, QuestionStats>> {
  const attempts = await getAttempts();
  const stats: Record<string, QuestionStats> = {};

  attempts.forEach((attempt) => {
    attempt.questionsSnapshot.forEach((question) => {
      const studentAnswers = attempt.answers?.[question.id] || [];
      const correctAnswers = question.correctAnswers || [];

      const isCorrect =
        studentAnswers.length === correctAnswers.length &&
        studentAnswers.every((answer) => correctAnswers.includes(answer));

      const timeSpent = attempt.questionTimeSpent?.[question.id] ?? 0;

      const existing = stats[question.id];

      if (existing) {
        existing.timesAttempted += 1;
        if (isCorrect) existing.correctCount += 1;
        existing.maxTimeSpent = Math.max(existing.maxTimeSpent, timeSpent);
        existing.minTimeSpent = Math.min(existing.minTimeSpent, timeSpent);
      } else {
        stats[question.id] = {
          timesAttempted: 1,
          correctCount: isCorrect ? 1 : 0,
          maxTimeSpent: timeSpent,
          minTimeSpent: timeSpent,
        };
      }
    });
  });

  return stats;
}

export async function getAttemptById(id: string) {
  const { data, error } = await supabase
    .from("attempts")
    .select("*, profiles(full_name, email)")
    .eq("id", id)
    .single();

  if (error) throw error;

  return fromDb(data);
}