import { Question } from "@/lib/questionService";

type Props = {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string[]>;
  flaggedQuestions: Record<string, boolean>;
  questionTimeLeft: Record<string, number>;
  onSelectQuestion: (index: number) => void;
  isTimed?: boolean;
};

export default function QuestionNavigator({
  questions,
  currentIndex,
  answers,
  flaggedQuestions,
  questionTimeLeft,
  onSelectQuestion,
  isTimed = true,
}: Props) {
  return (
    <aside className="exam-right-navigator">
      <h3>Questions</h3>

      <div className="exam-question-grid">
        {questions.map((question, index) => {
          const isAnswered = Boolean(answers[question.id]?.length);
          const isCurrent = index === currentIndex;
          const isFlagged = Boolean(flaggedQuestions[question.id]);
          const remaining =
            questionTimeLeft[question.id] ?? question.timerSeconds ?? 60;
          const isExpired = isTimed && remaining <= 0;

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelectQuestion(index)}
              className={[
                "exam-question-pill",
                isCurrent ? "exam-question-current" : "",
                isAnswered ? "exam-question-answered" : "",
                isFlagged ? "exam-question-flagged" : "",
                isExpired ? "exam-question-expired" : "",
              ].join(" ")}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="exam-legend">
        <div><span className="legend-dot answered" /> Answered</div>
        <div><span className="legend-dot current" /> Current</div>
        <div><span className="legend-dot flagged" /> Flagged</div>
        <div><span className="legend-dot expired" /> Time up</div>
      </div>
    </aside>
  );
}