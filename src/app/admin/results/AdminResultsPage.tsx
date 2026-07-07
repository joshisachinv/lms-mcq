"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAttempts, Attempt } from "@/lib/attemptService";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageTitle from "@/components/ui/PageTitle";
import Table from "@/components/ui/Table";
import * as XLSX from "xlsx";

export default function AdminResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  const exportResultsToExcel = () => {
    const rows = attempts.map((attempt) => {
      const percentage =
        attempt.totalQuestions > 0
          ? Math.round((attempt.score / attempt.totalQuestions) * 100)
          : 0;

      return {
        Student: attempt.studentName || "Unknown",
        Exam: attempt.examTitle,
        Score: attempt.score,
        "Total Questions": attempt.totalQuestions,
        Percentage: `${percentage}%`,
        Submitted: new Date(attempt.submittedAt).toLocaleString(),
        "Overall Time Left": attempt.overallTimeLeft,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    XLSX.writeFile(workbook, "exam-results.xlsx");
  };
  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const data = await getAttempts();
        setAttempts(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load results.");
      } finally {
        setLoading(false);
      }
    };

    loadAttempts();
  }, []);

  if (loading) {
    return (
      <main className="page-container">
        <PageTitle
          title="Exam Results"
          subtitle="Loading student exam attempts..."
        />
      </main>
    );
  }

  return (
    <main className="page-container">
      <PageTitle
        title="Exam Results"
        subtitle="Review all submitted exam attempts."
      />

      <div className="action-row">
        <Link href="/admin/questions/review">
          <Button type="button" variant="secondary">
            Review Questions
          </Button>
        </Link>

        {attempts.length > 0 && (
          <Button type="button" variant="secondary" onClick={exportResultsToExcel}>
            Export Results to Excel
          </Button>
        )}
      </div>
      
      {attempts.length === 0 ? (
        <EmptyState message="No exam attempts found." />
      ) : (
        
        <Table>
          <thead>
            <tr>
              <th>Student</th>
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
                  ? Math.round(
                      (attempt.score / attempt.totalQuestions) * 100
                    )
                  : 0;

              return (
                <tr key={attempt.id}>
                  <td>
                    <strong>{attempt.studentName || "Unknown"}</strong>
                  </td>

                  <td>{attempt.examTitle}</td>

                  <td>
                    {attempt.score} / {attempt.totalQuestions}
                  </td>

                  <td>
                    <Badge
                      color={
                        percentage >= 80
                          ? "green"
                          : percentage >= 50
                          ? "yellow"
                          : "red"
                      }
                    >
                      {percentage}%
                    </Badge>
                  </td>

                  <td>
                    {new Date(attempt.submittedAt).toLocaleString()}
                  </td>

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