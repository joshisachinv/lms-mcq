"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Exam, getExams } from "@/lib/examService";
import { getAttempts, Attempt } from "@/lib/attemptService";

import EmptyState from "@/components/ui/EmptyState";
import PageTitle from "@/components/ui/PageTitle";
import Table from "@/components/ui/Table";

export default function StudentExamsPage() {
  const [activeExams, setActiveExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [examData, attemptData] = await Promise.all([
          getExams(),
          getAttempts(),
        ]);

        setActiveExams(examData.filter((exam) => exam.isActive));
        setAttempts(attemptData);
      } catch (error) {
        console.error(error);
        alert("Failed to load exams.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getAttemptsForExam = (examId: string) =>
    attempts.filter((attempt) => attempt.examId === examId);

  const getLastAttemptForExam = (examId: string) => {
    const examAttempts = getAttemptsForExam(examId);

    return [...examAttempts].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime()
    )[0];
  };

  const sortedExams = [...activeExams].sort((a, b) => {
    const aTaken = Boolean(getLastAttemptForExam(a.id));
    const bTaken = Boolean(getLastAttemptForExam(b.id));

    if (aTaken === bTaken) {
      return a.title.localeCompare(b.title);
    }

    return aTaken ? 1 : -1;
  });

  if (loading) {
    return (
      <main className="page-container">
        <PageTitle title="Available Exams" subtitle="Loading active exams..." />
      </main>
    );
  }

  return (
    <main className="page-container">
      <PageTitle
        title="Available Exams"
        subtitle="Choose an active exam to begin."
      />

      {activeExams.length === 0 ? (
        <EmptyState message="No active exams available." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Description</th>
              <th>Questions</th>
              <th>Timer</th>
              <th>Status</th>
              <th>Last Taken</th>
              <th>Last Score</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {sortedExams.map((exam) => {
              const lastAttempt = getLastAttemptForExam(exam.id);

              return (
                <tr key={exam.id}>
                  <td>{exam.title}</td>
                  <td>{exam.description}</td>
                  <td>{exam.questionIds.length}</td>
                  <td>{exam.overallTimerSeconds}s</td>
                  <td>{lastAttempt ? "Taken" : "Not Taken"}</td>
                  <td>
                    {lastAttempt
                      ? new Date(lastAttempt.submittedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    {lastAttempt
                      ? `${lastAttempt.score} / ${lastAttempt.totalQuestions}`
                      : "-"}
                  </td>
                  <td>
                    <Link
                      className="primary-button"
                      href={`/student/exams/take/${exam.id}`}
                    >
                      {lastAttempt ? "Retake" : "Take Exam"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </main>
  );
}