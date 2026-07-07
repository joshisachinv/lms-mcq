import { Question } from "@/lib/questionService";

import EmptyState from "@/components/ui/EmptyState";
import FormSection from "@/components/ui/FormSection";
import QuestionGrid from "@/components/questions/QuestionGrid";

type Props = {
  questions: Question[];
  selectedQuestionIds: string[];
  usedQuestionIds?: Set<string>;
  testedQuestionIds?: Set<string>;
  usageMap?: Record<string, number>;
  usageDetailsMap?: Record<string, string[]>;
  onQuestionUpdated: (question: Question) => void;
  onToggleQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
};

export default function ExamQuestionTable({
  questions,
  selectedQuestionIds,
  usedQuestionIds,
  testedQuestionIds,
  usageMap = {},
  usageDetailsMap = {},
  onQuestionUpdated,
  onToggleQuestion,
  onMoveQuestion,
}: Props) {
  return (
    <FormSection title={`Questions (${selectedQuestionIds.length} selected)`}>
      {questions.length === 0 ? (
        <EmptyState message="No questions match your filters." />
      ) : (
        <QuestionGrid
          mode="editExam"
          questions={questions}
          testedQuestionIds={testedQuestionIds || usedQuestionIds || new Set<string>()}
          usageMap={usageMap}
          usageDetailsMap={usageDetailsMap}
          selectedQuestionIds={selectedQuestionIds}
          onQuestionUpdated={onQuestionUpdated}
          onToggleQuestion={onToggleQuestion}
          onMoveQuestion={onMoveQuestion}
        />
      )}
    </FormSection>
  );
}
