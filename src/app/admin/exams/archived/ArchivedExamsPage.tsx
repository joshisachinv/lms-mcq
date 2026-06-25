"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Exam,
  getExams,
  restoreExam,
} from "@/lib/examService";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageTitle from "@/components/ui/PageTitle";
import Table from "@/components/ui/Table";

export default function ArchivedExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArchivedExams = async () => {
    try {
      setLoading(true);

      const data = await getExams(true);
      setExams(data.filter((exam) => exam.isArchived));
    } catch (error) {
      console.error(error);
      alert("Failed to load archived exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedExams();
  }, []);

  const handleRestore = async (id: string) => {
    const confirmed = confirm("Restore this exam?");
    if (!confirmed) return;

    try {
      await restoreExam(id);
      await loadArchivedExams();
    } catch (error) {
      console.error(error);
      alert("Failed to restore exam.");
    }
  };

  if (loading) {
    return (
      <main className="page-container">
        <PageTitle
          title="Archived Exams"
          subtitle="Loading archived exams..."
        />
      </main>
    );
  }

  return (
    <main className="page-container">
      <PageTitle
        title="Archived Exams"
        subtitle="Review and restore archived exams."
      />

      <div className="action-row" style={{ marginBottom: "16px" }}>
        <Link href="/admin/exams">
          <Button type="button" variant="secondary">
            Back to Exam Management
          </Button>
        </Link>
      </div>

      {exams.length === 0 ? (
        <EmptyState message="No archived exams found." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Questions</th>
              <th>Timer</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.title}</td>
                <td>{exam.description}</td>
                <td>{exam.questionIds.length}</td>
                <td>{exam.overallTimerSeconds}s</td>
                <td>
                  <Badge color="gray">Archived</Badge>
                </td>
                <td>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRestore(exam.id)}
                  >
                    Restore
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </main>
  );
}
