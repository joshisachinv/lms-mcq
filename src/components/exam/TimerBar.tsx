type Props = {
    examTitle: string;
    questionNumber: number;
    totalQuestions: number;
    overallTime: string;
    questionTime: string;
};

export default function TimerBar({
    examTitle,
    questionNumber,
    totalQuestions,
    overallTime,
    questionTime,
}: Props) {
    return (
        <div className="exam-timer-bar">
            <div>
                <strong>{examTitle}</strong>
                <span className="exam-muted">
                    {" "}
                    · Question {questionNumber} of {totalQuestions}
                </span>
            </div>

            <div className="exam-timers">
                <span>Overall: {overallTime}</span>
                <span>Question: {questionTime}</span>
            </div>
        </div>
    );
}