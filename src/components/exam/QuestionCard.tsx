import { Question } from "@/lib/questionService";
import MathText from "../math/MathText";
import Button from "@/components/ui/Button";
type Props = {
  question: Question;
  questionNumber: number;
  selectedAnswers: string[];
  isLocked: boolean;
  isFlagged: boolean;
  onToggleAnswer: (option: string) => void;
  onToggleFlag: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onToggleScratchpad: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  submitting: boolean;
};

export default function QuestionCard({
  question,
  questionNumber,
  selectedAnswers,
  isLocked,
  isFlagged,
  onToggleAnswer,
  onToggleFlag,
  onPrevious,
  onNext,
  onSubmit,
  onToggleScratchpad,
  canGoPrevious,
  canGoNext,
  submitting,
}: Props) {
  const hasImage = (value: unknown) => {
    return typeof value === "string" && value.trim().length > 0;
  };

  return (
    <section className="exam-question-card">
      <div className="exam-question-header">
        <div>
          <h2>Question {questionNumber}</h2>
          <p className="exam-muted">
            {question.subject} · {question.topic}
          </p>
        </div>

      
      </div>

      {isLocked && (
        <p className="exam-warning">
          Time is up for this question. You can review it, but cannot change the answer.
        </p>
      )}

      <p className="exam-question-text"><MathText text={question.questionText} /></p>

      {hasImage(question.questionImage) && (
        <img src={question.questionImage} alt="Question" className="exam-question-image" />
      )}

      <div className="exam-options">
        {["A", "B", "C", "D"].map((option) => {
          const selected = selectedAnswers.includes(option);

          const optionText = String(
            question[`option${option}` as keyof Question] || ""
          );

          const optionImage = String(
            question[`option${option}Image` as keyof Question] || ""
          );

          return (
            <label
              key={option}
              className={
                selected
                  ? "exam-option-card exam-option-selected"
                  : "exam-option-card"
              }
            >
              <input
                type={question.questionType === "single" ? "radio" : "checkbox"}
                name={question.id}
                checked={selected}
                disabled={isLocked}
                onChange={() => onToggleAnswer(option)}
              />

              <div>
                <strong>{option}.</strong> <MathText text={optionText} />

                {hasImage(optionImage) && (
                  <img
                    src={optionImage}
                    alt={`Option ${option}`}
                    className="exam-option-image"
                  />
                )}
              </div>
            </label>
          );
        })}
      </div>

      <div className="exam-bottom-actions">
        <Button
          type="button"
          variant="secondary"
          disabled={!canGoPrevious}
          onClick={onPrevious}
        >
          ◀ Previous
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={!canGoNext}
          onClick={onNext}
        >
          Next ▶
        </Button>

        <Button
          type="button"
          variant="primary"
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting ? "Submitting..." : "Submit Exam"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onToggleScratchpad}
        >
          Scratchpad
        </Button>

        <Button
          type="button"
          variant={isFlagged ? "danger" : "secondary"}
          onClick={onToggleFlag}
        >
          {isFlagged ? "🚩 Unflag" : "🚩 Flag"}
        </Button>
      </div>
    </section>
  );
}