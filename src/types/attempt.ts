export type Attempt = {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  answers: Record<string, string[]>;
  scratchpad: string;
};