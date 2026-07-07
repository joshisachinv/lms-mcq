"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAttemptById } from "@/lib/attemptService";
import MathText from "@/components/math/MathText";
import PageTitle from "@/components/ui/PageTitle";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

type Question = {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  questionType: string;
  questionText: string;
  questionImage: string;
  optionA: string;
  optionAImage: string;
  optionB: string;
  optionBImage: string;
  optionC: string;
  optionCImage: string;
  optionD: string;
  optionDImage: string;
  correctAnswers: string[];
  explanation: string;
  timerSeconds: number;
};

type Attempt = {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  answers: Record<string, string[]>;
  scratchpads: Record<string, string>;
  questionTimeSpent: Record<string, number>;
  questionTimeLeft: Record<string, number>;
  overallTimeLeft: number;
  questionsSnapshot: Question[];
};

export default function ResultDetailPage() {
  const params = useParams<{ id: string }>();
  const attemptId = params.id;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "wrong">("all");
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const hasImage = (value: unknown) => {
    return typeof value === "string" && value.trim().length > 0;
  };


  const reviewedQuestions = useMemo(() => {
    if (!attempt) return [];

    return attempt.questionsSnapshot.map((question, index) => {
      const studentAnswers = attempt.answers[question.id] || [];
      const correctAnswers = question.correctAnswers || [];
      const isCorrect =
        studentAnswers.length === correctAnswers.length &&
        studentAnswers.every((answer) => correctAnswers.includes(answer));

      return {
        question,
        index,
        studentAnswers,
        correctAnswers,
        isCorrect,
      };
    });
  }, [attempt]);

  const visibleReviewedQuestions = useMemo(() => {
    if (reviewFilter === "correct") {
      return reviewedQuestions.filter((item) => item.isCorrect);
    }

    if (reviewFilter === "wrong") {
      return reviewedQuestions.filter((item) => !item.isCorrect);
    }

    return reviewedQuestions;
  }, [reviewFilter, reviewedQuestions]);

  const correctCount = reviewedQuestions.filter((item) => item.isCorrect).length;
  const wrongCount = reviewedQuestions.length - correctCount;

  const jumpToQuestion = (questionId: string) => {
    questionRefs.current[questionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const loadAttempt = async () => {
      try {
        const data = await getAttemptById(attemptId);
        setAttempt(data);
      } catch (error) {
        console.error(error);
        setNotFound(true);
      }
    };

    loadAttempt();
  }, [attemptId]);

  if (notFound) {
    return (
      <main className="page-container">
        <PageTitle title="Result not found" />
        <EmptyState message="We couldn't find this attempt. It may have been removed." />
        <p className="mt-16">
          <Link className="secondary-button" href="/student/results">
            Back to Results
          </Link>
        </p>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="page-container">
        <p className="auth-loading">Loading result...</p>
      </main>
    );
  }

  return (
    <main className="page-container">
      <PageTitle title="Result Review" subtitle={attempt.examTitle} />

      <div className="result-review-toolbar">
        <div className="result-review-toolbar-metrics">
          <div className="result-review-metric">
            <strong>
              {attempt.score} / {attempt.totalQuestions}
            </strong>
            <span>Score</span>
          </div>
          <div className="result-review-metric">
            <strong>{correctCount}</strong>
            <span>Correct</span>
          </div>
          <div className="result-review-metric">
            <strong>{wrongCount}</strong>
            <span>Wrong</span>
          </div>
          <div className="result-review-metric">
            <strong>{attempt.overallTimeLeft}s</strong>
            <span>Time left</span>
          </div>
        </div>

        <div className="result-review-toolbar-controls">
          <div className="result-review-filter-tabs" aria-label="Review filter">
            <button
              type="button"
              className={reviewFilter === "all" ? "active" : ""}
              onClick={() => setReviewFilter("all")}
            >
              All {reviewedQuestions.length}
            </button>
            <button
              type="button"
              className={reviewFilter === "correct" ? "active" : ""}
              onClick={() => setReviewFilter("correct")}
            >
              Correct {correctCount}
            </button>
            <button
              type="button"
              className={reviewFilter === "wrong" ? "active" : ""}
              onClick={() => setReviewFilter("wrong")}
            >
              Wrong {wrongCount}
            </button>
          </div>

          <div className="result-question-jump-list" aria-label="Jump to question">
            {reviewedQuestions.map(({ question, index, isCorrect }) => (
              <button
                key={question.id}
                type="button"
                className={
                  isCorrect
                    ? "result-question-jump result-question-jump-correct"
                    : "result-question-jump result-question-jump-wrong"
                }
                onClick={() => {
                  if (reviewFilter === "correct" && !isCorrect) setReviewFilter("all");
                  if (reviewFilter === "wrong" && isCorrect) setReviewFilter("all");
                  window.setTimeout(() => jumpToQuestion(question.id), 0);
                }}
                title={`Question ${index + 1}: ${isCorrect ? "Correct" : "Wrong"}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="review-summary-grid">
        <div>
          <strong>{new Date(attempt.submittedAt).toLocaleDateString()}</strong>
          <span>Submitted</span>
        </div>
        <div>
          <strong>{visibleReviewedQuestions.length}</strong>
          <span>Questions shown</span>
        </div>
      </div>

      <div className="section-heading-row">
        <h2>Question Review</h2>
      </div>

      {visibleReviewedQuestions.map(({ question, index, studentAnswers, correctAnswers, isCorrect }) => {
        return (
          <div
            key={question.id}
            ref={(element) => {
              questionRefs.current[question.id] = element;
            }}
            className={`surface-panel review-question-card ${
              isCorrect ? "review-question-card-correct" : "review-question-card-wrong"
            }`}
          >
            <div className="review-question-header">
              <h3>Question {index + 1}</h3>
              <Badge color={isCorrect ? "green" : "red"}>
                {isCorrect ? "Correct" : "Incorrect"}
              </Badge>
            </div>

            <div className="review-meta-row">
              <span>
                <strong>Subject:</strong> {question.subject}
              </span>
              <span>
                <strong>Topic:</strong> {question.topic}
              </span>
            </div>

            <p className="review-question-text">
              <MathText text={question.questionText} />
            </p>

            {hasImage(question.questionImage) && (
              <img
                src={question.questionImage}
                alt="Question"
                className="exam-question-image"
              />
            )}

            <div className="review-options">
              {["A", "B", "C", "D"].map((option) => {
                const optionText = String(
                  question[`option${option}` as keyof Question] || ""
                );
                const optionImage = String(
                  question[`option${option}Image` as keyof Question] || ""
                );

                const studentSelected = studentAnswers.includes(option);
                const correctSelected = correctAnswers.includes(option);

                const optionClass = correctSelected
                  ? "review-option review-option-correct"
                  : studentSelected
                  ? "review-option review-option-incorrect"
                  : "review-option";

                return (
                  <div key={option} className={optionClass}>
                    <strong>{option}.</strong>
                    <div>
                      <MathText text={optionText} />

                      {hasImage(optionImage) && (
                        <img
                          src={optionImage}
                          alt={`Option ${option}`}
                          className="exam-option-image"
                        />
                      )}

                      {studentSelected && (
                        <span className="review-option-tag review-option-tag-incorrect">
                          {correctSelected ? "" : "Your answer"}
                        </span>
                      )}
                      {correctSelected && (
                        <span className="review-option-tag review-option-tag-correct">
                          Correct answer{studentSelected ? " · your answer" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="review-footer-row">
              <span>
                <strong>Your answer:</strong>{" "}
                {studentAnswers.length > 0 ? studentAnswers.join(", ") : "Not answered"}
              </span>
              <span>
                <strong>Correct answer:</strong> {correctAnswers.join(", ")}
              </span>
              <span>
                <strong>Time spent:</strong>{" "}
                {attempt.questionTimeSpent?.[question.id] ?? 0}s
              </span>
              <span>
                <strong>Time remaining:</strong>{" "}
                {attempt.questionTimeLeft?.[question.id] ?? 0}s
              </span>
            </div>

            <div className="form-section-title mt-16">Scratchpad</div>
            {attempt.scratchpads?.[question.id] ? (
              <img
                src={attempt.scratchpads[question.id]}
                alt={`Scratchpad for question ${index + 1}`}
                className="review-scratchpad-image"
              />
            ) : (
              <p className="exam-muted">No scratchpad used for this question.</p>
            )}

            <div className="explanation">
              <strong>Explanation:</strong>{" "}
              {question.explanation ? (
                <MathText text={question.explanation} />
              ) : (
                "No explanation provided."
              )}
            </div>
          </div>
        );
      })}

      <p>
        <Link className="secondary-button" href="/student/results">
          Back to Results
        </Link>
      </p>
    </main>
  );
}
