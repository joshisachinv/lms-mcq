"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getQuestions,
  restoreQuestion,
  Question,
} from "@/lib/questionService";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageTitle from "@/components/ui/PageTitle";
import Table from "@/components/ui/Table";

export default function ArchivedQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArchivedQuestions = async () => {
    try {
      setLoading(true);

      const data = await getQuestions(true);
      setQuestions(data.filter((question) => question.isArchived));
    } catch (error) {
      console.error(error);
      alert("Failed to load archived questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedQuestions();
  }, []);

  const handleRestore = async (id: string) => {
    const confirmed = confirm("Restore this question?");
    if (!confirmed) return;

    try {
      await restoreQuestion(id);
      await loadArchivedQuestions();
    } catch (error) {
      console.error(error);
      alert("Failed to restore question.");
    }
  };

  if (loading) {
    return (
      <main className="page-container">
        <PageTitle
          title="Archived Questions"
          subtitle="Loading archived questions..."
        />
      </main>
    );
  }

  return (
    <main className="page-container">
      <PageTitle
        title="Archived Questions"
        subtitle="Review and restore archived questions."
      />

      <div className="action-row" style={{ marginBottom: "16px" }}>
        <Link href="/admin/questions">
          <Button type="button" variant="secondary">
            Back to Question Bank
          </Button>
        </Link>
      </div>

      {questions.length === 0 ? (
        <EmptyState message="No archived questions found." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Topic</th>
              <th>Difficulty</th>
              <th>Type</th>
              <th>Question</th>
              <th>Correct</th>
              <th>Timer</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {questions.map((question) => (
              <tr key={question.id}>
                <td>{question.subject}</td>
                <td>{question.topic}</td>
                <td>{question.difficulty}</td>
                <td>{question.questionType}</td>
                <td>{question.questionText}</td>
                <td>{question.correctAnswers.join(", ")}</td>
                <td>{question.timerSeconds}s</td>
                <td>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRestore(question.id)}
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