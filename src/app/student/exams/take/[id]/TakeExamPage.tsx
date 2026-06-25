"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import QuestionCard from "@/components/exam/QuestionCard";
import ScratchpadPanel from "@/components/exam/ScratchpadPanel";
import TimerBar from "@/components/exam/TimerBar";
import ExamHeader from "@/components/exam/ExamHeader";
import QuestionNavigator from "@/components/exam/QuestionNavigator";
import { getCurrentUser } from "@/lib/authService";
import { getExams, Exam } from "@/lib/examService";
import { getQuestions, Question } from "@/lib/questionService";
import { addAttempt } from "@/lib/attemptService";
import { User } from "@supabase/supabase-js";

export default function TakeExamPage() {
  const params = useParams<{ id: string }>();
  const examId = params.id;
  const [user, setUser] = useState<User | null>(null);

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [score, setScore] = useState<number | null>(null);

  const [scratchpads, setScratchpads] = useState<Record<string, string>>({});
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(true);

  const [overallTimeLeft, setOverallTimeLeft] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<Record<string, number>>({});
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({});

  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion =
    currentIndex >= 0 && currentIndex < questions.length
      ? questions[currentIndex]
      : null;

  const answeredCount = questions.filter((question) =>
    Boolean(answers[question.id]?.length)
  ).length;
  
  const shuffleQuestions = (items: Question[]) => {
    return [...items].sort(() => Math.random() - 0.5);
  };
  
  const progressPercent =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;

  useEffect(() => {
    const loadExam = async () => {
      try {
          const currentUser = await getCurrentUser();

          if (!currentUser) {
              alert("Please log in again.");
              return;
          }

          setUser(currentUser);
        
        const exams = await getExams();
        const allQuestions = await getQuestions();

        const foundExam = exams.find((e) => e.id === examId);

        if (!foundExam) return;

        let examQuestions = foundExam.questionIds
          .map((questionId) =>
            allQuestions.find((question) => question.id === questionId)
          )
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

        setExam(foundExam);
        setQuestions(examQuestions);
        setOverallTimeLeft(foundExam.overallTimerSeconds || 1800);
        setQuestionTimeLeft(initialQuestionTimeLeft);
        setQuestionTimeSpent(initialQuestionTimeSpent);
      } catch (error) {
        console.error(error);
        alert("Failed to load exam.");
      }
    };

    loadExam();
  }, [examId]);

  useEffect(() => {
    if (!exam || score !== null) return;

    const timer = setInterval(() => {
      setOverallTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          void submitExam(true);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, score]);

  useEffect(() => {
    if (!currentQuestion || score !== null) return;

    const timer = setInterval(() => {
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

      setQuestionTimeSpent((previous) => {
        const currentLeft =
          questionTimeLeft[currentQuestion.id] ??
          currentQuestion.timerSeconds ??
          60;

        if (currentLeft <= 0) return previous;

        return {
          ...previous,
          [currentQuestion.id]: (previous[currentQuestion.id] || 0) + 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, score, questionTimeLeft]);

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

    const remainingTime = questionTimeLeft[currentQuestion.id] ?? 0;
    if (remainingTime <= 0) return;

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
      const confirmed = confirm(
        `Submit exam now?\n\nAnswered: ${answeredCount} / ${questions.length}\nFlagged: ${
          Object.values(flaggedQuestions).filter(Boolean).length
        }`
      );

      if (!confirmed) return;
    }

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
        examId: exam.id,
        examTitle: exam.title,
        score: total,
        totalQuestions: questions.length,
        answers,
        scratchpads,
        questionTimeSpent,
        questionTimeLeft,
        overallTimeLeft,
        questionsSnapshot: questions,
      });

      setScore(total);
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

  const isCurrentQuestionLocked = currentQuestionTimeLeft <= 0;

  return (
    <main className="exam-page">
      <TimerBar
        examTitle={exam.title}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        overallTime={formatTime(overallTimeLeft)}
        questionTime={formatTime(currentQuestionTimeLeft)}
      />

      <ExamHeader
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        progressPercent={progressPercent}
      />

      <div className="exam-layout">
        <QuestionNavigator
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          questionTimeLeft={questionTimeLeft}
          onSelectQuestion={setCurrentIndex}
        />

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
                  canGoPrevious={currentIndex > 0}
                  canGoNext={currentIndex < questions.length - 1}
                  submitting={submitting}
              />

              <ScratchpadPanel
                  questionId={currentQuestion.id}
                  value={scratchpads[currentQuestion.id] || ""}
                  isOpen={isScratchpadOpen}
                  onToggleOpen={() => setIsScratchpadOpen((current) => !current)}
                  onChange={(value) =>
                      setScratchpads((previous) => ({
                          ...previous,
                          [currentQuestion.id]: value,
                      }))
                  }
              />
      </div>
    </main>
  );
}