"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAttemptById } from "@/lib/attemptService";
import MathText from "@/components/math/MathText";
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

  const hasImage = (value: unknown) => {
    return typeof value === "string" && value.trim().length > 0;
  };

  useEffect(() => {
  const loadAttempt = async () => {
    try {
      const data = await getAttemptById(attemptId);
      setAttempt(data);
    } catch (error) {
      console.error(error);
      alert("Result not found.");
    }
  };

  loadAttempt();
}, [attemptId]);

  if (!attempt) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Result not found</h1>
        <Link href="/student/results">Back to Results</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>Result Review</h1>

      <p>
        <strong>Exam:</strong> {attempt.examTitle}
      </p>

      <p>
        <strong>Score:</strong> {attempt.score} / {attempt.totalQuestions}
      </p>

      <p>
        <strong>Submitted:</strong>{" "}
        {new Date(attempt.submittedAt).toLocaleString()}
      </p>

      <p>
        <strong>Overall Time Remaining:</strong> {attempt.overallTimeLeft}s
      </p>


      <h2>Question Review</h2>

      {attempt.questionsSnapshot.map((question, index) => {
        const studentAnswers = attempt.answers[question.id] || [];
        const correctAnswers = question.correctAnswers || [];

        const isCorrect =
          studentAnswers.length === correctAnswers.length &&
          studentAnswers.every((answer) => correctAnswers.includes(answer));

        return (
          <div
            key={question.id}
            style={{
              border: "1px solid #ccc",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <h3>
              Question {index + 1}: {isCorrect ? "Correct" : "Incorrect"}
            </h3>

            <p>
              <strong>Subject:</strong> {question.subject}
            </p>

            <p>
              <strong>Topic:</strong> {question.topic}
            </p>

            <p>
              <strong>Question:</strong> <MathText text={question.questionText} />
            </p>

            {hasImage(question.questionImage) && (
              <img
                src={question.questionImage}
                alt="Question"
                style={{
                  maxWidth: "400px",
                  display: "block",
                  marginBottom: "12px",
                }}
              />
            )}

            {["A", "B", "C", "D"].map((option) => {
              const optionText = String(
                question[`option${option}` as keyof Question] || ""
              );

              const optionImage = String(
                question[`option${option}Image` as keyof Question] || ""
              );

              const studentSelected = studentAnswers.includes(option);
              const correctSelected = correctAnswers.includes(option);

              return (
                <div
                  key={option}
                  style={{
                    padding: "8px",
                    marginBottom: "6px",
                    backgroundColor: correctSelected
                      ? "#d4edda"
                      : studentSelected
                      ? "#f8d7da"
                      : "transparent",
                  }}
                >
                  <div>
                    <strong>{option}.</strong> <MathText text={optionText} />
                    {studentSelected && " - Student Answer"}
                    {correctSelected && " - Correct Answer"}
                  </div>

                  {hasImage(optionImage) && (
                    <img
                      src={optionImage}
                      alt={`Option ${option}`}
                      style={{
                        maxWidth: "200px",
                        display: "block",
                        marginTop: "6px",
                      }}
                    />
                  )}
                </div>
              );
            })}

            <p>
              <strong>Student Answer:</strong>{" "}
              {studentAnswers.length > 0
                ? studentAnswers.join(", ")
                : "Not answered"}
            </p>

            <p>
              <strong>Correct Answer:</strong> {correctAnswers.join(", ")}
            </p>

            <p>
              <strong>Time Spent:</strong>{" "}
              {attempt.questionTimeSpent?.[question.id] ?? 0}s
            </p>

            <p>
              <strong>Question Time Remaining:</strong>{" "}
              {attempt.questionTimeLeft?.[question.id] ?? 0}s
            </p>
            
            <h4>Scratchpad for this question</h4>

            {attempt.scratchpads?.[question.id] ? (
              <img
                src={attempt.scratchpads[question.id]}
                alt={`Scratchpad for question ${index + 1}`}
                style={{
                  maxWidth: "450px",
                  border: "1px solid #ccc",
                  background: "#ffffff",
                  display: "block",
                }}
              />
            ) : (
              <p>No scratchpad used for this question.</p>
            )}
            
            <p>
              <strong>Explanation:</strong>{" "}
              {question.explanation || "No explanation provided."}
            </p>
          </div>
        );
      })}

      <p>
        <Link href="/student/results">Back to Results</Link>
      </p>
    </main>
  );
}