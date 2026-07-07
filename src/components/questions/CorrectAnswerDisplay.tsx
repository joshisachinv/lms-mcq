import MathText from "@/components/math/MathText";
import { Question } from "@/lib/questionService";

export const OPTION_FIELDS = [
  { label: "A", textField: "optionA", imageField: "optionAImage" },
  { label: "B", textField: "optionB", imageField: "optionBImage" },
  { label: "C", textField: "optionC", imageField: "optionCImage" },
  { label: "D", textField: "optionD", imageField: "optionDImage" },
] as const;

export type OptionField = (typeof OPTION_FIELDS)[number];
export type OptionImageField = OptionField["imageField"];

export function getCorrectOptions(question: Question) {
  return OPTION_FIELDS.filter((option) =>
    question.correctAnswers?.includes(option.label)
  );
}

type Props = {
  question: Question;
  editable?: boolean;
  onEdit?: () => void;
  onOpenImage?: (field: OptionImageField, title: string) => void;
};

export default function CorrectAnswerDisplay({
  question,
  editable = false,
  onEdit,
  onOpenImage,
}: Props) {
  const correctOptions = getCorrectOptions(question);

  return (
    <div
      className={editable ? "correct-answer-display editable-cell" : "correct-answer-display"}
      title={editable ? "Double-click to edit answer text and correct answer" : undefined}
      onDoubleClick={editable ? onEdit : undefined}
    >
      {correctOptions.length === 0 ? (
        <span className="exam-muted">No correct answer set</span>
      ) : (
        correctOptions.map((option) => {
          const text = String(question[option.textField] || "");
          const image = String(question[option.imageField] || "");

          return (
            <div key={option.label} className="correct-answer-item">
              <span className="correct-answer-label">✓</span>
              <span className="correct-answer-option-label">{option.label}</span>

              {text && <MathText text={text} />}

              {image && (
                <button
                  type="button"
                  className="question-image-button"
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    onOpenImage?.(option.imageField, `Correct answer ${option.label} image`);
                  }}
                  title="Double-click to zoom, replace, or remove answer image"
                >
                  <img src={image} alt={`Correct answer ${option.label}`} className="correct-answer-image" />
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
