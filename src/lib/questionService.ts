import { supabase } from "@/lib/supabaseClient";

export type Question = {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  questionType: string;
  questionText: string;
  questionImage: string;
  optionA: string;
  optionAImage: string;
  optionB: string;
  optionBImage: string;
  optionC: string;
  optionCImage: string;
  optionD: string;
  optionDImage: string;
  correctAnswers: string[];
  explanation: string;
  timerSeconds: number;
  isArchived: boolean;
};

const fromDb = (row: any): Question => ({
  id: row.id,
  subject: row.subject,
  topic: row.topic || "",
  difficulty: row.difficulty || "",
  questionType: row.question_type,
  questionText: row.question_text,
  questionImage: row.question_image || "",
  optionA: row.option_a || "",
  optionAImage: row.option_a_image || "",
  optionB: row.option_b || "",
  optionBImage: row.option_b_image || "",
  optionC: row.option_c || "",
  optionCImage: row.option_c_image || "",
  optionD: row.option_d || "",
  optionDImage: row.option_d_image || "",
  correctAnswers: row.correct_answers || [],
  explanation: row.explanation || "",
  timerSeconds: row.timer_seconds || 60,
  isArchived: row.is_archived || false,
});

const toDb = (question: Omit<Question, "id">) => ({
  subject: question.subject,
  topic: question.topic,
  difficulty: question.difficulty,
  question_type: question.questionType,
  question_text: question.questionText,
  question_image: question.questionImage,
  option_a: question.optionA,
  option_a_image: question.optionAImage,
  option_b: question.optionB,
  option_b_image: question.optionBImage,
  option_c: question.optionC,
  option_c_image: question.optionCImage,
  option_d: question.optionD,
  option_d_image: question.optionDImage,
  correct_answers: question.correctAnswers,
  explanation: question.explanation,
  timer_seconds: question.timerSeconds,
  is_archived: question.isArchived,
});

export async function getQuestions(includeArchived = false) {
  let query = supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(fromDb);
}

export async function addQuestion(question: Omit<Question, "id">) {
  const { data, error } = await supabase
    .from("questions")
    .insert(toDb(question))
    .select()
    .single();

  if (error) throw error;

  return fromDb(data);
}

export async function updateQuestion(question: Question) {
  const { id, ...rest } = question;

  const { data, error } = await supabase
    .from("questions")
    .update(toDb(rest))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return fromDb(data);
}

export async function archiveQuestion(id: string) {
  const { error } = await supabase
    .from("questions")
    .update({ is_archived: true })
    .eq("id", id);

  if (error) throw error;
}

export async function duplicateQuestion(question: Question) {
  const { id, isArchived, ...copy } = question;

  return addQuestion({
    ...copy,
    questionText: `${question.questionText} (Copy)`,
    isArchived: false,
  });
}

export async function restoreQuestion(id: string) {
  const { error } = await supabase
    .from("questions")
    .update({ is_archived: false })
    .eq("id", id);

  if (error) throw error;
}