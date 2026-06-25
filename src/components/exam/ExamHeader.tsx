type Props = {
  answeredCount: number;
  totalQuestions: number;
  progressPercent: number;
};

export default function ExamHeader({
  answeredCount,
  totalQuestions,
  progressPercent,
}: Props) {
  return (
    <div className="exam-progress-wrap">
      <div className="exam-progress-text">
        Answered {answeredCount} / {totalQuestions} · {progressPercent}%
      </div>

      <div className="exam-progress-track">
        <div
          className="exam-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}