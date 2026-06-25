import { supabase } from "@/lib/supabaseClient";

export type Exam = {
  id: string;
  title: string;
  description: string;
  overallTimerSeconds: number;
  isActive: boolean;
  questionIds: string[];
  isArchived: boolean;
  randomizeQuestions: boolean;
};

const fromDb = (row: any): Exam => ({
  id: row.id,
  title: row.title,
  description: row.description || "",
  overallTimerSeconds: row.overall_timer_seconds || 1800,
  isActive: row.is_active || false,
  isArchived: row.is_archived || false,
  randomizeQuestions: row.randomize_questions || false,
  questionIds:
    row.exam_questions
      ?.sort((a: any, b: any) => a.display_order - b.display_order)
      .map((item: any) => item.question_id) || [],
});

export async function getExams(includeArchived = false) {
  let query = supabase
    .from("exams")
    .select("*, exam_questions(question_id, display_order)")
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(fromDb);
}

export async function addExam(input: Omit<Exam, "id">) {
  const { data: exam, error } = await supabase
    .from("exams")
    .insert({
      title: input.title,
      description: input.description,
      overall_timer_seconds: input.overallTimerSeconds,
      is_active: input.isActive,
      is_archived: input.isArchived,
      randomize_questions: input.randomizeQuestions,
    })
    .select()
    .single();

  if (error) throw error;

  const examQuestionRows = input.questionIds.map((questionId, index) => ({
    exam_id: exam.id,
    question_id: questionId,
    display_order: index + 1,
  }));

  if (examQuestionRows.length > 0) {
    const { error: questionError } = await supabase
      .from("exam_questions")
      .insert(examQuestionRows);

    if (questionError) throw questionError;
  }

  return exam.id;
}

export async function toggleExamActive(id: string, isActive: boolean) {
  const { error } = await supabase
    .from("exams")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteExam(id: string) {
  const { error } = await supabase.from("exams").delete().eq("id", id);

  if (error) throw error;
}

export async function archiveExam(id: string) {
  const { error } = await supabase
    .from("exams")
    .update({ is_archived: true, is_active: false })
    .eq("id", id);

  if (error) throw error;
}

export async function restoreExam(id: string) {
  const { error } = await supabase
    .from("exams")
    .update({ is_archived: false })
    .eq("id", id);

  if (error) throw error;
}

export async function duplicateExam(exam: Exam) {
  return addExam({
    title: `${exam.title} (Copy)`,
    description: exam.description,
    overallTimerSeconds: exam.overallTimerSeconds,
    isActive: false,
    isArchived: false,
    questionIds: exam.questionIds,
    randomizeQuestions: exam.randomizeQuestions,
  });
}
export async function updateExam(input: Exam) {
  const { error: examError } = await supabase
    .from("exams")
    .update({
      title: input.title,
      description: input.description,
      overall_timer_seconds: input.overallTimerSeconds,
      is_active: input.isActive,
      is_archived: input.isArchived,
      randomize_questions: input.randomizeQuestions,
    })
    .eq("id", input.id);

  if (examError) throw examError;

  const { error: deleteError } = await supabase
    .from("exam_questions")
    .delete()
    .eq("exam_id", input.id);

  if (deleteError) throw deleteError;

  const rows = input.questionIds.map((questionId, index) => ({
    exam_id: input.id,
    question_id: questionId,
    display_order: index + 1,
  }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("exam_questions")
      .insert(rows);

    if (insertError) throw insertError;
  }
}