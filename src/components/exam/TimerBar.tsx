type Props = {
    subject: string;
    questionNumber: number;
    totalQuestions: number;
    overallTime: string;
    questionTime: string;
    isOverallLow?: boolean;
    isQuestionLow?: boolean;
    isTimed?: boolean;
};

export default function TimerBar({
    subject,
    questionNumber,
    totalQuestions,
    overallTime,
    questionTime,
    isOverallLow = false,
    isQuestionLow = false,
    isTimed = true,
}: Props) {
    return (
        <div className={["exam-timer-bar", isOverallLow || isQuestionLow ? "exam-timer-bar-warning" : ""].join(" ")}>
            <div>
                <strong>{subject}</strong>
                <span className="exam-muted">
                    {" "}
                    · Question {questionNumber} of {totalQuestions}
                </span>
            </div>

            <div className="exam-timers">
                <span className={isOverallLow ? "exam-time-chip exam-time-low" : "exam-time-chip"}>
                    {isTimed ? "Overall left" : "Overall spent"}: {overallTime}
                </span>
                <span className={isQuestionLow ? "exam-time-chip exam-time-low" : "exam-time-chip"}>
                    {isTimed ? "Question left" : "Question spent"}: {questionTime}
                </span>
            </div>
        </div>
    );
}
