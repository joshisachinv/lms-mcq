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
  studentName: row.profiles?.full_name || row.profiles?.email || "",
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

export async function addAttempt(
  input: Omit<Attempt, "id" | "submittedAt" | "studentName">
) {
  const { data, error } = await supabase
    .from("attempts")
    .insert({
      student_id: input.studentId,
      exam_id: input.examId,
      exam_title: input.examTitle,
      score: input.score,
      total_questions: input.totalQuestions,
      answers: input.answers,
      scratchpads: input.scratchpads,
      question_time_spent: input.questionTimeSpent,
      question_time_left: input.questionTimeLeft,
      overall_time_spent: input.overallTimeSpent,
      overall_time_left: input.overallTimeLeft,
      questions_snapshot: input.questionsSnapshot,
    })
    .select()
    .single();

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

export async function getAttemptById(id: string) {
  const { data, error } = await supabase
    .from("attempts")
    .select("*, profiles(full_name, email)")
    .eq("id", id)
    .single();

  if (error) throw error;

  return fromDb(data);
}