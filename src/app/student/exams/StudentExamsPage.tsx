"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Exam, getExams } from "@/lib/examService";

export default function StudentExamsPage() {
  const [activeExams, setActiveExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveExams = async () => {
      try {
        const exams = await getExams();
        setActiveExams(exams.filter((exam) => exam.isActive));
      } catch (error) {
        console.error(error);
        alert("Failed to load exams.");
      } finally {
        setLoading(false);
      }
    };

    loadActiveExams();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Available Exams</h1>
        <p>Loading exams...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>Available Exams</h1>

      {activeExams.length === 0 ? (
        <p>No active exams available.</p>
      ) : (
        <div className="table-card">
          <table className="data-table">
          <thead>
            <tr>
              <th>Exam</th>
              <th>Description</th>
              <th>Questions</th>
              <th>Timer</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {activeExams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.title}</td>
                <td>{exam.description}</td>
                <td>{exam.questionIds.length}</td>
                <td>{exam.overallTimerSeconds}s</td>
                <td>
                  <Link href={`/student/exams/take/${exam.id}`}>
                    Take Exam
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}
    </main>
  );
}