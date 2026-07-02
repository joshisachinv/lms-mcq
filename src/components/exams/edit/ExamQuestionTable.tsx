import { Exam } from "@/lib/examService";
import { Question } from "@/lib/questionService";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FormSection from "@/components/ui/FormSection";
import DataTable from "@/components/datatable/DataTable";
import MathText from "@/components/math/MathText";

type Props = {
  exam: Exam;
  questions: Question[];
  onToggleQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
};

export default function ExamQuestionTable({
  exam,
  questions,
  onToggleQuestion,
  onMoveQuestion,
}: Props) {
  return (
    <FormSection title={`Questions (${exam.questionIds.length} selected)`}>
      {questions.length === 0 ? (
        <EmptyState message="No questions match your filters." />
      ) : (
        <DataTable
          data={questions}
          getRowKey={(question) => question.id}
          columns={[
            {
              key: "select",
              label: "Selected",
              filter: true,
              sortable: true,
              getValue: (question) =>
                exam.questionIds.includes(question.id)
                  ? "Selected"
                  : "Not Selected",
              render: (question) => (
                <input
                  type="checkbox"
                  checked={exam.questionIds.includes(question.id)}
                  onChange={() => onToggleQuestion(question.id)}
                />
              ),
            },
            {
              key: "order",
              label: "Order",
              filter: true,
              sortable: true,
              getValue: (question) => {
                const index = exam.questionIds.indexOf(question.id);
                return index === -1 ? "Not selected" : String(index + 1);
              },
              render: (question) => {
                const index = exam.questionIds.indexOf(question.id);

                if (index === -1) return "-";

                return (
                  <div className="order-controls">
                    <span className="order-number">{index + 1}</span>

                    <button
                      type="button"
                      className="icon-button"
                      disabled={index === 0}
                      onClick={() => onMoveQuestion(question.id, "up")}
                      title="Move up"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      disabled={index === exam.questionIds.length - 1}
                      onClick={() => onMoveQuestion(question.id, "down")}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                );
              },
            },
            {
              key: "subject",
              label: "Subject",
              filter: true,
              sortable: true,
            },
            {
              key: "topic",
              label: "Topic",
              filter: true,
              sortable: true,
            },
            {
              key: "difficulty",
              label: "Difficulty",
              filter: true,
              sortable: true,
            },
            {
              key: "questionText",
              label: "Question",
              sortable: true,
              render: (question) => (
                <div className="question-cell">
                  <MathText text={question.questionText} />
                </div>
              ),
            },
          ]}
        />
      )}
    </FormSection>
  );
}