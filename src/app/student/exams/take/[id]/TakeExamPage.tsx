"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import QuestionCard from "@/components/exam/QuestionCard";
import ScratchpadPanel from "@/components/exam/ScratchpadPanel";
import TimerBar from "@/components/exam/TimerBar";
import ExamHeader from "@/components/exam/ExamHeader";
import QuestionNavigator from "@/components/exam/QuestionNavigator";
import { useAuth } from "@/components/auth/AuthProvider";
import { getExamById, Exam } from "@/lib/examService";
import { getQuestionsByIds, Question } from "@/lib/questionService";
import { addAttempt } from "@/lib/attemptService";
import Dialog from "@/components/ui/Dialog";

export default function TakeExamPage() {
  const params = useParams<{ id: string }>();
  const examId = params.id;
  const { user, loading: userLoading, profile} = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [score, setScore] = useState<number | null>(null);

  const [scratchpads, setScratchpads] = useState<Record<string, string>>({});
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  
  const [overallTimeSpent, setOverallTimeSpent] = useState(0);
  const [overallTimeLeft, setOverallTimeLeft] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<Record<string, number>>({});
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({});

  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);
  const bypassLeaveWarningRef = useRef(false);

  const autosaveKey = useMemo(() => {
    if (!examId || !user?.id) return "";
    return `exam-draft:${examId}:${user.id}`;
  }, [examId, user?.id]);

  const currentQuestion =
    currentIndex >= 0 && currentIndex < questions.length
      ? questions[currentIndex]
      : null;

  const answeredCount = questions.filter((question) =>
    Boolean(answers[question.id]?.length)
  ).length;
  
  const shuffleQuestions = (items: Question[]) => {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  };
  
  const progressPercent =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      alert("Please log in again.");
      return;
    }

    const loadExam = async () => {
      try {
        const foundExam = await getExamById(examId);
        const examQuestionsUnordered = await getQuestionsByIds(
          foundExam.questionIds
        );

        const questionsById = new Map(
          examQuestionsUnordered.map((question) => [question.id, question])
        );

        let examQuestions = foundExam.questionIds
          .map((questionId) => questionsById.get(questionId))
          .filter(Boolean) as Question[];

        if (foundExam.randomizeQuestions) {
          examQuestions = shuffleQuestions(examQuestions);
        }

        const initialQuestionTimeLeft: Record<string, number> = {};
        const initialQuestionTimeSpent: Record<string, number> = {};

        examQuestions.forEach((question) => {
          initialQuestionTimeLeft[question.id] = question.timerSeconds || 60;
          initialQuestionTimeSpent[question.id] = 0;
        });

        let savedDraft: any = null;

        if (typeof window !== "undefined" && user?.id) {
          const savedValue = window.localStorage.getItem(`exam-draft:${examId}:${user.id}`);
          if (savedValue) {
            try {
              savedDraft = JSON.parse(savedValue);
            } catch {
              savedDraft = null;
            }
          }
        }

        setExam(foundExam);
        setQuestions(examQuestions);
        setAnswers(savedDraft?.answers || {});
        setScratchpads(savedDraft?.scratchpads || {});
        setFlaggedQuestions(savedDraft?.flaggedQuestions || {});
        setCurrentIndex(savedDraft?.currentIndex || 0);
        setOverallTimeSpent(savedDraft?.overallTimeSpent || 0);
        setOverallTimeLeft(savedDraft?.overallTimeLeft ?? foundExam.overallTimerSeconds ?? 1800);
        setQuestionTimeLeft({ ...initialQuestionTimeLeft, ...savedDraft?.questionTimeLeft });
        setQuestionTimeSpent({ ...initialQuestionTimeSpent, ...savedDraft?.questionTimeSpent });
      } catch (error) {
        console.error(error);
        alert("Failed to load exam.");
      }
    };

    loadExam();
  }, [examId, user, userLoading]);

  useEffect(() => {
    if (!exam || score !== null) return;

    const timer = setInterval(() => {
      setOverallTimeSpent((previous) => previous + 1);

      if (exam.isTimed) {
        setOverallTimeLeft((previous) => {
          if (previous <= 1) {
            clearInterval(timer);
            void submitExam(true);
            return 0;
          }

          return previous - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, score]);

  useEffect(() => {
    if (!currentQuestion || score !== null) return;

    const timer = setInterval(() => {
      if (exam?.isTimed) {
        setQuestionTimeLeft((previous) => {
          const currentLeft =
            previous[currentQuestion.id] ?? currentQuestion.timerSeconds ?? 60;

          if (currentLeft <= 0) {
            return previous;
          }

          return {
            ...previous,
            [currentQuestion.id]: currentLeft - 1,
          };
        });
      }

      setQuestionTimeSpent((previousSpent) => ({
        ...previousSpent,
        [currentQuestion.id]: (previousSpent[currentQuestion.id] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, score, exam?.isTimed]);

  useEffect(() => {
    if (!autosaveKey || !exam || score !== null) return;

    const draft = {
      answers,
      scratchpads,
      flaggedQuestions,
      currentIndex,
      overallTimeSpent,
      overallTimeLeft,
      questionTimeLeft,
      questionTimeSpent,
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(autosaveKey, JSON.stringify(draft));
  }, [
    autosaveKey,
    exam,
    score,
    answers,
    scratchpads,
    flaggedQuestions,
    currentIndex,
    overallTimeSpent,
    overallTimeLeft,
    questionTimeLeft,
    questionTimeSpent,
  ]);

  useEffect(() => {
    if (!exam || score !== null) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [exam, score]);

  useEffect(() => {
    if (!exam || score !== null) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (bypassLeaveWarningRef.current) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickedInsideExam = target.closest(".exam-shell");
      if (clickedInsideExam) return;

      const link = target.closest("a[href]") as HTMLAnchorElement | null;

      if (link?.href) {
        event.preventDefault();
        event.stopPropagation();

        setPendingNavigationHref(link.href);
        setShowSubmitDialog(true);
        return;
      }

      const button = target.closest("button") as HTMLButtonElement | null;

      if (button) {
        event.preventDefault();
        event.stopPropagation();

        setPendingNavigationHref("/");
        setShowSubmitDialog(true);
      }
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [exam, score]);
  
  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const hasImage = (value: unknown) => {
    return typeof value === "string" && value.trim().length > 0;
  };

  const toggleAnswer = (option: string) => {
    if (!currentQuestion) return;

    if (exam?.isTimed) {
      const remainingTime =
        questionTimeLeft[currentQuestion.id] ??
        currentQuestion.timerSeconds ??
        60;

      if (remainingTime <= 0) return;
    }

    const questionId = currentQuestion.id;
    const existingAnswers = answers[questionId] || [];

    if (currentQuestion.questionType === "single") {
      setAnswers({
        ...answers,
        [questionId]: [option],
      });
      return;
    }

    const updatedAnswers = existingAnswers.includes(option)
      ? existingAnswers.filter((answer) => answer !== option)
      : [...existingAnswers, option];

    setAnswers({
      ...answers,
      [questionId]: updatedAnswers,
    });
  };

  const toggleFlag = () => {
    if (!currentQuestion) return;

    setFlaggedQuestions((previous) => ({
      ...previous,
      [currentQuestion.id]: !previous[currentQuestion.id],
    }));
  };

  const submitExam = async (skipConfirm = false) => {
    if (!exam || !user || submitting) return;

    if (!skipConfirm) {
      setShowSubmitDialog(true);
      return;
    }

    setShowSubmitDialog(false);

    setSubmitting(true);

    let total = 0;

    questions.forEach((question) => {
      const studentAnswers = answers[question.id] || [];
      const correctAnswers = question.correctAnswers || [];

      const isCorrect =
        studentAnswers.length === correctAnswers.length &&
        studentAnswers.every((answer) => correctAnswers.includes(answer));

      if (isCorrect) total += 1;
    });

    try {
      await addAttempt({
        studentId: user.id,
        studentName: profile?.fullName || user.email || "Student",
        examId: exam.id,
        examTitle: exam.title,
        score: total,
        totalQuestions: questions.length,
        answers,
        scratchpads,
        questionTimeSpent,
        questionTimeLeft,
        overallTimeLeft: exam.isTimed ? overallTimeLeft : 0,
        overallTimeSpent,
        questionsSnapshot: questions,
      });

      if (autosaveKey) {
        window.localStorage.removeItem(autosaveKey);
      }

      setScore(total);

      if (pendingNavigationHref) {
        bypassLeaveWarningRef.current = true;
        window.location.href = pendingNavigationHref;
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save exam attempt.");
      setSubmitting(false);
    }
  };

  if (!exam) {
    return (
      <main className="page-container">
        <h1>Loading exam...</h1>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="page-container">
        <h1>{exam.title}</h1>
        <p>This exam has no questions.</p>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="page-container">
        <h1>Question not found.</h1>
      </main>
    );
  }

  if (score !== null) {
    return (
      <main className="page-container">
        <h1>Result</h1>
        <p>
          Score: {score} / {questions.length}
        </p>
        <p>Your answers, scratchpads, and timing data have been saved.</p>
      </main>
    );
  }

  const currentQuestionTimeLeft =
    questionTimeLeft[currentQuestion.id] ?? currentQuestion.timerSeconds ?? 60;

  const currentQuestionTimeDisplay = exam.isTimed
    ? currentQuestionTimeLeft
    : questionTimeSpent[currentQuestion.id] || 0;
    
  const isCurrentQuestionLocked =
    exam.isTimed && currentQuestionTimeLeft <= 0;

  return (
    <main className="exam-shell">
      <TimerBar
        subject={currentQuestion.subject || exam.title}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        overallTime={formatTime(exam.isTimed ? overallTimeLeft : overallTimeSpent)}
        questionTime={formatTime(currentQuestionTimeDisplay)}
        isTimed={exam.isTimed}
        isOverallLow={exam.isTimed && overallTimeLeft > 0 && overallTimeLeft <= 120}
        isQuestionLow={exam.isTimed && currentQuestionTimeLeft > 0 && currentQuestionTimeLeft <= 15}
      />

      <ExamHeader
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        progressPercent={progressPercent}
      />

      <div className="exam-main-layout">
        <section className="exam-main-question">
          <div className="exam-sticky-question-panel">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              selectedAnswers={answers[currentQuestion.id] || []}
              isLocked={isCurrentQuestionLocked}
              isFlagged={Boolean(flaggedQuestions[currentQuestion.id])}
              onToggleAnswer={toggleAnswer}
              onToggleFlag={toggleFlag}
              onPrevious={() => setCurrentIndex(currentIndex - 1)}
              onNext={() => setCurrentIndex(currentIndex + 1)}
              onSubmit={() => void submitExam(false)}
              onToggleScratchpad={() => setIsScratchpadOpen((current) => !current)}
              canGoPrevious={currentIndex > 0}
              canGoNext={currentIndex < questions.length - 1}
              submitting={submitting}
            />

            {isScratchpadOpen && (
              <div className="exam-inline-scratchpad">
                <ScratchpadPanel
                  questionId={currentQuestion.id}
                  value={scratchpads[currentQuestion.id] || ""}
                  isOpen={isScratchpadOpen}
                  onToggleOpen={() => setIsScratchpadOpen(false)}
                  onChange={(value) =>
                    setScratchpads((previous) => ({
                      ...previous,
                      [currentQuestion.id]: value,
                    }))
                  }
                />
              </div>
            )}
          </div>
        </section>

        <QuestionNavigator
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          questionTimeLeft={questionTimeLeft}
          onSelectQuestion={setCurrentIndex}
          isTimed={exam.isTimed}
        />
      </div>

      <Dialog
        open={showSubmitDialog}
        title="Submit exam?"
        description="Please confirm before submitting. You will not be able to change your answers after submission."
        confirmLabel={submitting ? "Submitting..." : "Submit exam"}
        cancelLabel="Continue exam"
        onCancel={() => {
          setPendingNavigationHref(null);
          setShowSubmitDialog(false);
        }}
        onConfirm={() => void submitExam(true)}
      >
        <div className="submit-confirm-summary">
          <div><strong>{answeredCount}</strong><span>Answered</span></div>
          <div><strong>{questions.length - answeredCount}</strong><span>Unanswered</span></div>
          <div><strong>{Object.values(flaggedQuestions).filter(Boolean).length}</strong><span>Flagged</span></div>
        </div>
      </Dialog>
    </main>
  );
}