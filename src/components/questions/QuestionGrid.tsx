"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";

import { Question, updateQuestion } from "@/lib/questionService";
import { uploadQuestionImage } from "@/lib/imageStorage";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MathText from "@/components/math/MathText";
import CorrectAnswerDisplay, {
  OptionImageField,
} from "@/components/questions/CorrectAnswerDisplay";
import ImagePreviewModal from "@/components/questions/ImagePreviewModal";
import InlineAnswerEditor from "@/components/questions/InlineAnswerEditor";
import InlineQuestionEditor from "@/components/questions/InlineQuestionEditor";
import { useToast } from "@/components/ui/ToastProvider";

export type QuestionGridStats = {
  timesAttempted: number;
  correctCount: number;
  maxTimeSpent: number;
  minTimeSpent: number;
};

type GridMode = "bank" | "createExam" | "editExam" | "review";

type Props = {
  questions: Question[];
  testedQuestionIds: Set<string>;
  usageMap?: Record<string, number>;
  usageDetailsMap?: Record<string, string[]>;
  statsMap?: Record<string, QuestionGridStats>;
  showReviewStats?: boolean;
  mode?: GridMode;
  selectedQuestionIds?: string[];
  onToggleQuestion?: (questionId: string) => void;
  onMoveQuestion?: (questionId: string, direction: "up" | "down") => void;
  onQuestionUpdated: (question: Question) => void;
  renderActions?: (question: Question) => ReactNode;
  pageSize?: number;
};

type EditingCell =
  | { questionId: string; field: "questionText" }
  | { questionId: string; field: "timerSeconds" }
  | { questionId: string; field: "answers" }
  | null;

type ImageField =
  | "questionImage"
  | "optionAImage"
  | "optionBImage"
  | "optionCImage"
  | "optionDImage";

type ImageTarget = {
  question: Question;
  field: ImageField;
  title: string;
} | null;

const EMPTY_STATS: QuestionGridStats = {
  timesAttempted: 0,
  correctCount: 0,
  maxTimeSpent: 0,
  minTimeSpent: 0,
};

function getImageValue(question: Question, field: ImageField) {
  const value = question[field];
  return typeof value === "string" ? value : "";
}

function InlineEditActions({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="inline-edit-actions">
      <Button variant="primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
      <Button variant="secondary" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
    </div>
  );
}

export default function QuestionGrid({
  questions,
  testedQuestionIds,
  usageMap = {},
  usageDetailsMap = {},
  statsMap = {},
  showReviewStats = false,
  mode = showReviewStats ? "review" : "bank",
  selectedQuestionIds = [],
  onToggleQuestion,
  onMoveQuestion,
  onQuestionUpdated,
  renderActions,
  pageSize = 100,
}: Props) {
  const [editing, setEditing] = useState<EditingCell>(null);
  const toast = useToast();
  const [draftQuestion, setDraftQuestion] = useState<Question | null>(null);
  const [savingId, setSavingId] = useState<string>("");
  const [imageTarget, setImageTarget] = useState<ImageTarget>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const isExamMode = mode === "createExam" || mode === "editExam";
  const isReviewMode = mode === "review" || showReviewStats;
  const allowSelection = Boolean(onToggleQuestion);
  const allowOrdering = Boolean(onMoveQuestion);

  const orderedQuestions = useMemo(() => {
    if (!isExamMode) return questions;

    return [...questions].sort((a, b) => {
      const indexA = selectedQuestionIds.indexOf(a.id);
      const indexB = selectedQuestionIds.indexOf(b.id);

      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }, [isExamMode, questions, selectedQuestionIds]);

  const firstAvailableIndex = orderedQuestions.findIndex(
    (question) => !selectedQuestionIds.includes(question.id),
  );

  const totalPages = Math.max(1, Math.ceil(orderedQuestions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const pageEndIndex = Math.min(
    pageStartIndex + pageSize,
    orderedQuestions.length,
  );
  const pagedQuestions = orderedQuestions.slice(pageStartIndex, pageEndIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [questions, pageSize, selectedQuestionIds.join("|")]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const beginEdit = (
    question: Question,
    field: NonNullable<EditingCell>["field"],
  ) => {
    setEditing({ questionId: question.id, field });
    setDraftQuestion({
      ...question,
      correctAnswers: [...question.correctAnswers],
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraftQuestion(null);
  };

  const saveDraft = async () => {
    if (!draftQuestion) return;

    try {
      setSavingId(draftQuestion.id);
      const updated = await updateQuestion(draftQuestion);
      onQuestionUpdated(updated);
      cancelEdit();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update question.");
    } finally {
      setSavingId("");
    }
  };

  const replaceImage = async (file: File | null) => {
    if (!imageTarget || !file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await uploadQuestionImage(file);
      const updated = await updateQuestion({
        ...imageTarget.question,
        [imageTarget.field]: imageUrl,
      });
      onQuestionUpdated(updated);
      setImageTarget({ ...imageTarget, question: updated });
    } catch (error) {
      console.error(error);
      toast.error("Failed to replace image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async () => {
    if (!imageTarget) return;

    try {
      setUploadingImage(true);
      const updated = await updateQuestion({
        ...imageTarget.question,
        [imageTarget.field]: "",
      });
      onQuestionUpdated(updated);
      setImageTarget(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const openImage = (question: Question, field: ImageField, title: string) => {
    if (!getImageValue(question, field)) return;
    setImageTarget({ question, field, title });
  };

  const openDraftImage = (field: OptionImageField, title: string) => {
    if (!draftQuestion) return;
    openImage(draftQuestion, field, title);
  };

  const renderSelectionCell = (question: Question) => {
    const selected = selectedQuestionIds.includes(question.id);

    return (
      <button
        type="button"
        className={
          selected ? "selection-pill selection-pill-selected" : "selection-pill"
        }
        onClick={() => onToggleQuestion?.(question.id)}
        title={selected ? "Remove from exam" : "Add to exam"}
      >
        {selected ? "✓ Included" : "+ Add"}
      </button>
    );
  };

  const renderOrderCell = (question: Question) => {
    const index = selectedQuestionIds.indexOf(question.id);
    if (index === -1) return <span className="exam-muted">-</span>;

    return (
      <div className="order-controls">
        <span className="order-number">{index + 1}</span>
        <button
          type="button"
          className="icon-button"
          disabled={index === 0}
          onClick={() => onMoveQuestion?.(question.id, "up")}
          title="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          className="icon-button"
          disabled={index === selectedQuestionIds.length - 1}
          onClick={() => onMoveQuestion?.(question.id, "down")}
          title="Move down"
        >
          ↓
        </button>
      </div>
    );
  };

  const renderQuestionCell = (question: Question) => {
    const isEditing =
      editing?.questionId === question.id &&
      editing.field === "questionText" &&
      draftQuestion;

    if (isEditing) {
      return (
        <InlineQuestionEditor
          value={draftQuestion.questionText}
          saving={savingId === question.id}
          onChange={(value) =>
            setDraftQuestion({ ...draftQuestion, questionText: value })
          }
          onSave={saveDraft}
          onCancel={cancelEdit}
        />
      );
    }

    return (
      <div
        className="question-cell editable-cell"
        title="Double-click to edit question text"
        onDoubleClick={() => beginEdit(question, "questionText")}
      >
        <MathText text={question.questionText ?? ""} />
      </div>
    );
  };

  const renderQuestionImageCell = (question: Question) => {
    if (!question.questionImage)
      return <span className="exam-muted">None</span>;

    return (
      <button
        type="button"
        className="question-image-button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          openImage(question, "questionImage", "Question image");
        }}
        title="Click to zoom, replace, or remove image"
      >
        <img
          src={question.questionImage}
          alt="Question"
          className="question-bank-image"
        />
      </button>
    );
  };

  const renderAnswerCell = (question: Question) => {
    const isEditing =
      editing?.questionId === question.id &&
      editing.field === "answers" &&
      draftQuestion;

    if (isEditing) {
      return (
        <InlineAnswerEditor
          question={draftQuestion}
          saving={savingId === question.id}
          onChange={setDraftQuestion}
          onSave={saveDraft}
          onCancel={cancelEdit}
          onOpenImage={openDraftImage}
        />
      );
    }

    return (
      <CorrectAnswerDisplay
        question={question}
        editable
        onEdit={() => beginEdit(question, "answers")}
        onOpenImage={(field, title) => openImage(question, field, title)}
      />
    );
  };

  const renderTimerCell = (question: Question) => {
    const isEditing =
      editing?.questionId === question.id &&
      editing.field === "timerSeconds" &&
      draftQuestion;

    if (isEditing) {
      return (
        <div className="inline-edit-box timer-edit-box">
          <input
            type="number"
            min="0"
            className="inline-edit-input timer-edit-input"
            value={draftQuestion.timerSeconds}
            onChange={(event) =>
              setDraftQuestion({
                ...draftQuestion,
                timerSeconds: Number(event.target.value || 0),
              })
            }
            autoFocus
          />
          <InlineEditActions
            saving={savingId === question.id}
            onSave={saveDraft}
            onCancel={cancelEdit}
          />
        </div>
      );
    }

    return (
      <span
        className="timer-pill editable-cell"
        title="Double-click to edit timer"
        onDoubleClick={() => beginEdit(question, "timerSeconds")}
      >
        {question.timerSeconds}s
      </span>
    );
  };

  const renderUsedCell = (question: Question) => {
    const examNames = usageDetailsMap[question.id] || [];
    const count = usageMap[question.id] || examNames.length;

    if (!testedQuestionIds.has(question.id) && count === 0) {
      return <span className="exam-muted">—</span>;
    }

    const title = examNames.length
      ? examNames.join("\n")
      : `Used in ${count} exam${count === 1 ? "" : "s"}`;

    return (
      <Badge color="green">
        <span title={title}>
          {examNames[0] || `Used (${count})`}
          {examNames.length > 1 ? ` +${examNames.length - 1}` : ""}
        </span>
      </Badge>
    );
  };

  const renderHeader = () => {
    if (isReviewMode) {
      return (
        <tr>
          <th>Question</th>
          <th>Image</th>
          <th>Correct answer</th>
          <th>Timer</th>
          <th>Used</th>
          <th>Attempts</th>
          <th>Correct</th>
          <th>Accuracy</th>
          <th>Max Time</th>
          <th>Min Time</th>
          {renderActions && <th>Actions</th>}
        </tr>
      );
    }

    if (isExamMode) {
      return (
        <tr>
          {allowSelection && <th>Action</th>}
          {allowOrdering && <th>Order</th>}
          <th>Image</th>
          <th>Question</th>
          <th>Correct answer</th>
          <th>Timer</th>
          <th>Used</th>
        </tr>
      );
    }

    return (
      <tr>
        <th>Question</th>
        <th>Image</th>
        <th>Correct answer</th>
        <th>Timer</th>
        <th>Used</th>
        {renderActions && <th>Actions</th>}
      </tr>
    );
  };

  const renderColGroup = () => {
    if (isReviewMode) {
      return (
        <colgroup>
          <col className="qg-col-question" />
          <col className="qg-col-image" />
          <col className="qg-col-answer" />
          <col className="qg-col-timer" />
          <col className="qg-col-used" />
          <col className="qg-col-stat" />
          <col className="qg-col-stat" />
          <col className="qg-col-stat" />
          <col className="qg-col-stat" />
          <col className="qg-col-stat" />
          {renderActions && <col className="qg-col-actions" />}
        </colgroup>
      );
    }

    if (isExamMode) {
      return (
        <colgroup>
          {allowSelection && <col className="qg-col-action" />}
          {allowOrdering && <col className="qg-col-order" />}
          <col className="qg-col-image" />
          <col className="qg-col-question" />
          <col className="qg-col-answer" />
          <col className="qg-col-timer" />
          <col className="qg-col-used" />
        </colgroup>
      );
    }

    return (
      <colgroup>
        <col className="qg-col-question" />
        <col className="qg-col-image" />
        <col className="qg-col-answer" />
        <col className="qg-col-timer" />
        <col className="qg-col-used" />
        {renderActions && <col className="qg-col-actions" />}
      </colgroup>
    );
  };

  return (
    <>
      <div className="table-card question-grid-card">
        <div className="table-toolbar">
          <div className="table-summary">
            Showing {orderedQuestions.length === 0 ? 0 : pageStartIndex + 1}-
            {pageEndIndex} of {orderedQuestions.length}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
              >
                First
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
              >
                Previous
              </Button>
              <span className="pagination-status">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safeCurrentPage === totalPages}
              >
                Next
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
              >
                Last
              </Button>
            </div>
          )}
        </div>
        <table className="data-table question-grid-table">
          {renderColGroup()}
          <thead>{renderHeader()}</thead>
          <tbody>
            {pagedQuestions.map((question, pageIndex) => {
              const index = pageStartIndex + pageIndex;
              const stats = statsMap[question.id] ?? EMPTY_STATS;
              const isTested =
                testedQuestionIds.has(question.id) ||
                Boolean(usageMap[question.id]);
              const isSelected = selectedQuestionIds.includes(question.id);
              const accuracy = stats.timesAttempted
                ? Math.round((stats.correctCount / stats.timesAttempted) * 100)
                : null;
              const accuracyColor =
                accuracy === null
                  ? "gray"
                  : accuracy >= 70
                    ? "green"
                    : accuracy >= 40
                      ? "yellow"
                      : "red";
              const rowClassName =
                [
                  isTested ? "question-row-tested" : "",
                  isSelected ? "question-row-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined;
              const showSeparator =
                isExamMode &&
                index === firstAvailableIndex &&
                firstAvailableIndex > 0;
              const columnCount =
                (allowSelection ? 1 : 0) +
                (allowOrdering ? 1 : 0) +
                (isExamMode
                  ? 5
                  : isReviewMode
                    ? 10 + (renderActions ? 1 : 0)
                    : 5 + (renderActions ? 1 : 0));

              return (
                <Fragment key={question.id}>
                  {showSeparator && (
                    <tr className="question-grid-section-row">
                      <td colSpan={columnCount}>Additional questions</td>
                    </tr>
                  )}
                  <tr key={question.id} className={rowClassName}>
                    {isReviewMode ? (
                      <>
                        <td>{renderQuestionCell(question)}</td>
                        <td>{renderQuestionImageCell(question)}</td>
                        <td>{renderAnswerCell(question)}</td>
                        <td>{renderTimerCell(question)}</td>
                        <td>{renderUsedCell(question)}</td>
                        <td>
                          {stats.timesAttempted || (
                            <span className="exam-muted">Never attempted</span>
                          )}
                        </td>
                        <td>
                          {stats.timesAttempted ? (
                            `${stats.correctCount} / ${stats.timesAttempted}`
                          ) : (
                            <span className="exam-muted">-</span>
                          )}
                        </td>
                        <td>
                          {accuracy === null ? (
                            <span className="exam-muted">-</span>
                          ) : (
                            <Badge color={accuracyColor}>{accuracy}%</Badge>
                          )}
                        </td>
                        <td>
                          {stats.timesAttempted ? (
                            `${stats.maxTimeSpent}s`
                          ) : (
                            <span className="exam-muted">-</span>
                          )}
                        </td>
                        <td>
                          {stats.timesAttempted ? (
                            `${stats.minTimeSpent}s`
                          ) : (
                            <span className="exam-muted">-</span>
                          )}
                        </td>
                        {renderActions && <td>{renderActions(question)}</td>}
                      </>
                    ) : isExamMode ? (
                      <>
                        {allowSelection && (
                          <td>{renderSelectionCell(question)}</td>
                        )}
                        {allowOrdering && <td>{renderOrderCell(question)}</td>}
                        <td>{renderQuestionImageCell(question)}</td>
                        <td>{renderQuestionCell(question)}</td>
                        <td>{renderAnswerCell(question)}</td>
                        <td>{renderTimerCell(question)}</td>
                        <td>{renderUsedCell(question)}</td>
                      </>
                    ) : (
                      <>
                        <td>{renderQuestionCell(question)}</td>
                        <td>{renderQuestionImageCell(question)}</td>
                        <td>{renderAnswerCell(question)}</td>
                        <td>{renderTimerCell(question)}</td>
                        <td>{renderUsedCell(question)}</td>
                        {renderActions && <td>{renderActions(question)}</td>}
                      </>
                    )}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {imageTarget && (
        <ImagePreviewModal
          imageUrl={getImageValue(imageTarget.question, imageTarget.field)}
          title={imageTarget.title}
          editable
          uploading={uploadingImage}
          onClose={() => setImageTarget(null)}
          onReplace={replaceImage}
          onRemove={removeImage}
        />
      )}
    </>
  );
}
