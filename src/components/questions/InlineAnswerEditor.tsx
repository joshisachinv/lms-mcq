import Button from "@/components/ui/Button";
import { Question } from "@/lib/questionService";
import { OPTION_FIELDS, OptionImageField } from "@/components/questions/CorrectAnswerDisplay";

type Props = {
  question: Question;
  saving: boolean;
  onChange: (question: Question) => void;
  onSave: () => void;
  onCancel: () => void;
  onOpenImage: (field: OptionImageField, title: string) => void;
};

export default function InlineAnswerEditor({
  question,
  saving,
  onChange,
  onSave,
  onCancel,
  onOpenImage,
}: Props) {
  const isMultiple = question.questionType === "multiple";

  return (
    <div className="inline-edit-box answer-edit-box">
      {OPTION_FIELDS.map((option) => {
        const checked = question.correctAnswers.includes(option.label);
        const image = String(question[option.imageField] || "");

        return (
          <label key={option.label} className="answer-edit-row">
            <input
              type={isMultiple ? "checkbox" : "radio"}
              name={`correct-${question.id}`}
              checked={checked}
              onChange={(event) => {
                const nextCorrectAnswers = isMultiple
                  ? event.target.checked
                    ? Array.from(new Set([...question.correctAnswers, option.label]))
                    : question.correctAnswers.filter((item) => item !== option.label)
                  : [option.label];

                onChange({ ...question, correctAnswers: nextCorrectAnswers });
              }}
            />
            <span className="answer-option-label">{option.label}</span>
            <input
              className="inline-edit-input"
              value={String(question[option.textField] || "")}
              onChange={(event) => onChange({ ...question, [option.textField]: event.target.value })}
            />
            {image && (
              <button
                type="button"
                className="question-image-button"
                onClick={(event) => {
                  event.preventDefault();
                  onOpenImage(option.imageField, `Option ${option.label} image`);
                }}
                title="Open answer image"
              >
                <img src={image} alt={`Option ${option.label}`} className="correct-answer-image" />
              </button>
            )}
          </label>
        );
      })}
      <div className="inline-edit-actions">
        <Button variant="primary" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}
