import { Question } from "@/lib/questionService";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FormSection from "@/components/ui/FormSection";
import DataTable from "@/components/datatable/DataTable";
import MathText from "@/components/math/MathText";

type Props = {
    questions: Question[];
    selectedQuestionIds: string[];
    onToggleQuestion: (questionId: string) => void;
    onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
};

export default function ExamQuestionSelector({
    questions,
    selectedQuestionIds,
    onToggleQuestion,
    onMoveQuestion,
}: Props) {
    return (
        <FormSection title={`Questions (${selectedQuestionIds.length} selected)`}>
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
                                selectedQuestionIds.includes(question.id)
                                    ? "Selected"
                                    : "Not Selected",
                            render: (question) => (
                                <input
                                    type="checkbox"
                                    checked={selectedQuestionIds.includes(question.id)}
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
                                const index = selectedQuestionIds.indexOf(question.id);
                                return index === -1 ? "Not selected" : String(index + 1);
                            },
                            render: (question) => {
                                const index = selectedQuestionIds.indexOf(question.id);
                                if (index === -1) return "-";

                                return (
                                    <div className="order-controls">
                                        <span className="order-number">{index + 1}</span>

                                        <button
                                            type="button"
                                            className="icon-button"
                                            disabled={index === 0}
                                            onClick={() => onMoveQuestion(question.id, "up")}
                                        >
                                            ↑
                                        </button>

                                        <button
                                            type="button"
                                            className="icon-button"
                                            disabled={index === selectedQuestionIds.length - 1}
                                            onClick={() => onMoveQuestion(question.id, "down")}
                                        >
                                            ↓
                                        </button>
                                    </div>
                                );
                            },
                        },
                        { key: "subject", label: "Subject", filter: true, sortable: true },
                        { key: "topic", label: "Topic", filter: true, sortable: true },
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