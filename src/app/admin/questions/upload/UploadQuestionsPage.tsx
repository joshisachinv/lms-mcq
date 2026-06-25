"use client";

import * as XLSX from "xlsx";
import { useState } from "react";
import { addQuestion } from "@/lib/questionService";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageTitle from "@/components/ui/PageTitle";
import Table from "@/components/ui/Table";

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

export default function UploadQuestionsPage() {
  const [preview, setPreview] = useState<Question[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    const questions: Question[] = rows.map((row) => ({
      id: crypto.randomUUID(),
      subject: String(row.subject || ""),
      topic: String(row.topic || ""),
      difficulty: String(row.difficulty || "Easy"),
      questionType: String(row.questionType || "single"),
      questionText: String(row.questionText || ""),
      questionImage: String(row.questionImage || ""),

      optionA: String(row.optionA || ""),
      optionAImage: String(row.optionAImage || ""),

      optionB: String(row.optionB || ""),
      optionBImage: String(row.optionBImage || ""),

      optionC: String(row.optionC || ""),
      optionCImage: String(row.optionCImage || ""),

      optionD: String(row.optionD || ""),
      optionDImage: String(row.optionDImage || ""),
      
      correctAnswers: String(row.correctAnswers || "")
        .split(",")
        .map((answer) => answer.trim())
        .filter(Boolean),
      explanation: String(row.explanation || ""),
      timerSeconds: Number(row.timerSeconds || 60),
    }));

    setPreview(questions);
  };

  const saveQuestions = async () => {
    try {
      for (const question of preview) {
        await addQuestion({
          subject: question.subject,
          topic: question.topic,
          difficulty: question.difficulty,
          questionType: question.questionType,
          questionText: question.questionText,
          questionImage: question.questionImage,
          optionA: question.optionA,
          optionAImage: question.optionAImage,
          optionB: question.optionB,
          optionBImage: question.optionBImage,
          optionC: question.optionC,
          optionCImage: question.optionCImage,
          optionD: question.optionD,
          optionDImage: question.optionDImage,
          correctAnswers: question.correctAnswers,
          explanation: question.explanation,
          timerSeconds: question.timerSeconds,
        });
      }

      alert(`${preview.length} questions uploaded to Supabase.`);
      setPreview([]);
    } catch (error) {
      console.error(error);
      alert("Failed to upload questions.");
    }
  };

 return (
  <main className="page-container">
    <PageTitle
      title="Upload Questions"
      subtitle="Upload questions quickly using an Excel file."
    />

    <Card className="form-card">
      <div className="form-grid">
        <label className="form-label">
          Excel File
          <input
            className="form-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
          />
        </label>

        <p>
          Required columns: subject, topic, difficulty, questionType,
          questionText, optionA, optionB, optionC, optionD, correctAnswers,
          explanation, timerSeconds.
        </p>
      </div>
    </Card>

    <br />

    {preview.length === 0 ? (
      <EmptyState message="No file uploaded yet." />
    ) : (
      <>
        <h2>Preview</h2>

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
            </tr>
          </thead>

          <tbody>
            {preview.map((question) => (
              <tr key={question.id}>
                <td>{question.subject}</td>
                <td>{question.topic}</td>
                <td>{question.difficulty}</td>
                <td>{question.questionType}</td>
                <td>{question.questionText}</td>
                <td>{question.correctAnswers.join(", ")}</td>
                <td>{question.timerSeconds}s</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <br />

        <div className="action-row">
          <Button type="button" onClick={saveQuestions}>
            Save Uploaded Questions
          </Button>
        </div>
      </>
    )}
  </main>
);
}