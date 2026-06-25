export type Exam = {
  id: string;
  title: string;
  description: string;
  overallTimerSeconds: number;
  isActive: boolean;
  questionIds: string[];
};