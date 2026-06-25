"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAttempts, Attempt } from "@/lib/attemptService";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageTitle from "@/components/ui/PageTitle";
import Table from "@/components/ui/Table";

export default function StudentResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const data = await getAttempts();
        setAttempts(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load results.");
      }
    };

    loadAttempts();
  }, []);

  return (
    <main className="page-container">
      <PageTitle
        title="My Results"
        subtitle="Review your submitted exams, scores, answers, timing, and scratchpad work."
      />

      {attempts.length === 0 ? (
        <EmptyState message="No results found." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Submitted</th>
              <th>Review</th>
            </tr>
          </thead>

          <tbody>
            {attempts.map((attempt) => {
              const percentage =
                attempt.totalQuestions > 0
                  ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                  : 0;

              return (
                <tr key={attempt.id}>
                  <td>{attempt.examTitle}</td>
                  <td>
                    {attempt.score} / {attempt.totalQuestions}
                  </td>
                  <td>
                    <Badge color={percentage >= 50 ? "green" : "gray"}>
                      {percentage}%
                    </Badge>
                  </td>
                  <td>{new Date(attempt.submittedAt).toLocaleString()}</td>
                  <td>
                    <Link href={`/student/results/${attempt.id}`}>
                      <Button type="button" variant="secondary">
                        Review
                      </Button>
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