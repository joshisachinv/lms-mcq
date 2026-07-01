"use client";

import * as XLSX from "xlsx";
import { useMemo, useRef, useState } from "react";
import { addQuestion, getQuestions, Question } from "@/lib/questionService";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageTitle from "@/components/ui/PageTitle";
import Table from "@/components/ui/Table";
import MathText from "@/components/math/MathText";

type ImportQuestion = Question & {
  rowNumber: number;
  validationErrors: string[];
  duplicateReason?: string;
};

type ImportReport = {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
};

const REQUIRED_COLUMNS = [
  "subject",
  "topic",
  "difficulty",
  "questionType",
  "questionText",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctAnswers",
  "explanation",
  "timerSeconds",
];

const OPTIONAL_COLUMNS = [
  "questionImage",
  "optionAImage",
  "optionBImage",
  "optionCImage",
  "optionDImage",
];

const SUPPORTED_EXTENSIONS = ["xlsx", "xls", "csv"];

const normaliseHeader = (value: string) => value.trim();
const normaliseAnswer = (answer: string) => answer.trim().toUpperCase();
const duplicateKey = (question: Pick<Question, "subject" | "topic" | "questionText">) =>
  `${question.subject.trim().toLowerCase()}|${question.topic.trim().toLowerCase()}|${question.questionText
    .trim()
    .toLowerCase()}`;

const valueAsString = (value: unknown) => String(value ?? "").trim();

function validateQuestion(question: ImportQuestion) {
  const errors: string[] = [];

  if (!question.subject) errors.push("Subject is required.");
  if (!question.questionText) errors.push("Question text is required.");
  if (!question.optionA) errors.push("Option A is required.");
  if (!question.optionB) errors.push("Option B is required.");
  if (!question.optionC) errors.push("Option C is required.");
  if (!question.optionD) errors.push("Option D is required.");

  if (!["single", "multiple"].includes(question.questionType)) {
    errors.push("questionType must be single or multiple.");
  }

  if (question.correctAnswers.length === 0) {
    errors.push("At least one correct answer is required.");
  }

  const allowedAnswers = new Set(["A", "B", "C", "D"]);
  const invalidAnswers = question.correctAnswers.filter((answer) => !allowedAnswers.has(answer));
  if (invalidAnswers.length > 0) {
    errors.push(`Invalid correct answer: ${invalidAnswers.join(", ")}. Use A, B, C or D.`);
  }

  if (question.questionType === "single" && question.correctAnswers.length !== 1) {
    errors.push("Single-choice questions must have exactly one correct answer.");
  }

  if (!Number.isFinite(question.timerSeconds) || question.timerSeconds <= 0) {
    errors.push("timerSeconds must be greater than 0.");
  }

  return errors;
}

export default function UploadQuestionsPage() {
  const [preview, setPreview] = useState<ImportQuestion[]>([]);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validQuestions = useMemo(
    () => preview.filter((question) => question.validationErrors.length === 0 && !question.duplicateReason),
    [preview]
  );

  const invalidQuestions = useMemo(
    () => preview.filter((question) => question.validationErrors.length > 0),
    [preview]
  );

  const duplicateQuestions = useMemo(
    () => preview.filter((question) => question.duplicateReason),
    [preview]
  );

  const resetImport = () => {
    setPreview([]);
    setMissingColumns([]);
    setFileName("");
    setReport(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseQuestionFile = async (file: File) => {
    setReport(null);
    setFileName(file.name);

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      alert("Unsupported file type. Please upload .xlsx, .xls or .csv.");
      return;
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
      alert("The uploaded file does not contain a worksheet.");
      return;
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
    });

    const headerRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      blankrows: false,
    });
    const headers = (headerRows[0] || []).map((header) => normaliseHeader(String(header)));
    const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
    setMissingColumns(missing);

    const existingQuestions = await getQuestions(true);
    const existingKeys = new Set(existingQuestions.map(duplicateKey));
    const fileKeys = new Map<string, number>();

    const questions: ImportQuestion[] = rows.map((row, index) => {
      const correctAnswers = valueAsString(row.correctAnswers)
        .split(",")
        .map(normaliseAnswer)
        .filter(Boolean);

      const question: ImportQuestion = {
        id: crypto.randomUUID(),
        rowNumber: index + 2,
        subject: valueAsString(row.subject),
        topic: valueAsString(row.topic),
        difficulty: valueAsString(row.difficulty) || "Easy",
        questionType: valueAsString(row.questionType).toLowerCase() || "single",
        questionText: valueAsString(row.questionText),
        questionImage: valueAsString(row.questionImage),
        optionA: valueAsString(row.optionA),
        optionAImage: valueAsString(row.optionAImage),
        optionB: valueAsString(row.optionB),
        optionBImage: valueAsString(row.optionBImage),
        optionC: valueAsString(row.optionC),
        optionCImage: valueAsString(row.optionCImage),
        optionD: valueAsString(row.optionD),
        optionDImage: valueAsString(row.optionDImage),
        correctAnswers,
        explanation: valueAsString(row.explanation),
        timerSeconds: Number(valueAsString(row.timerSeconds) || 60),
        isArchived: false,
        validationErrors: [],
      };

      question.validationErrors = validateQuestion(question);

      const key = duplicateKey(question);
      const firstFileRow = fileKeys.get(key);
      if (existingKeys.has(key)) {
        question.duplicateReason = "Already exists in question bank.";
      } else if (firstFileRow) {
        question.duplicateReason = `Duplicate of row ${firstFileRow}.`;
      } else {
        fileKeys.set(key, question.rowNumber);
      }

      return question;
    });

    setPreview(questions);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await parseQuestionFile(file);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) await parseQuestionFile(file);
  };

  const saveQuestions = async () => {
    if (validQuestions.length === 0) {
      alert("No valid non-duplicate questions are available to import.");
      return;
    }

    let imported = 0;
    let failed = 0;

    setIsSaving(true);
    try {
      for (const question of validQuestions) {
        try {
          const { id, rowNumber, validationErrors, duplicateReason, ...payload } = question;
          await addQuestion(payload);
          imported += 1;
        } catch (error) {
          console.error(`Failed to import row ${question.rowNumber}`, error);
          failed += 1;
        }
      }

      const skipped = preview.length - imported - failed;
      setReport({ imported, updated: 0, skipped, failed });

      if (failed === 0) {
        setPreview([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="page-container">
      <PageTitle
        title="Import Questions"
        subtitle="Upload questions using Excel or CSV, review validation results, then save valid questions to Supabase."
      />

      <Card className="form-card upload-card">
        <div
          className={`upload-dropzone ${isDragging ? "upload-dropzone-active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div>
            <h2>Drag & drop your question file</h2>
            <p>Supported formats: Excel .xlsx, Excel .xls and CSV .csv.</p>
          </div>

          <div className="action-row">
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
            {preview.length > 0 || fileName ? (
              <Button type="button" variant="secondary" onClick={resetImport}>
                Clear Import
              </Button>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileUpload}
          />
        </div>

        <div className="import-help-grid">
          <div>
            <strong>Required columns</strong>
            <p>{REQUIRED_COLUMNS.join(", ")}.</p>
          </div>
          <div>
            <strong>Optional image URL columns</strong>
            <p>{OPTIONAL_COLUMNS.join(", ")}.</p>
          </div>
        </div>
      </Card>

      {fileName ? <p className="table-summary">Selected file: {fileName}</p> : null}

      {missingColumns.length > 0 ? (
        <div className="import-alert import-alert-danger">
          <strong>Missing required columns:</strong> {missingColumns.join(", ")}
        </div>
      ) : null}

      {report ? (
        <div className="import-report">
          <span>Imported: {report.imported}</span>
          <span>Updated: {report.updated}</span>
          <span>Skipped: {report.skipped}</span>
          <span>Failed: {report.failed}</span>
        </div>
      ) : null}

      {preview.length === 0 ? (
        <EmptyState message="No file uploaded yet." />
      ) : (
        <>
          <div className="import-summary-grid">
            <Card className="import-summary-card import-summary-valid">
              <span>{validQuestions.length}</span>
              <p>valid questions</p>
            </Card>
            <Card className="import-summary-card import-summary-warning">
              <span>{duplicateQuestions.length}</span>
              <p>duplicates skipped</p>
            </Card>
            <Card className="import-summary-card import-summary-danger">
              <span>{invalidQuestions.length}</span>
              <p>validation issues</p>
            </Card>
          </div>

          <div className="section-heading-row">
            <h2>Preview first 10 rows</h2>
            <Button type="button" onClick={saveQuestions} disabled={isSaving || validQuestions.length === 0}>
              {isSaving ? "Saving..." : `Save ${validQuestions.length} Valid Questions`}
            </Button>
          </div>

          <Table>
            <thead>
              <tr>
                <th>Row</th>
                <th>Status</th>
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
              {preview.slice(0, 10).map((question) => {
                const issue = question.validationErrors[0] || question.duplicateReason;
                return (
                  <tr key={question.id}>
                    <td>{question.rowNumber}</td>
                    <td>
                      {question.validationErrors.length === 0 && !question.duplicateReason ? (
                        <span className="badge badge-green">Valid</span>
                      ) : question.duplicateReason ? (
                        <span className="badge badge-yellow">Duplicate</span>
                      ) : (
                        <span className="badge badge-red">Issue</span>
                      )}
                      {issue ? <div className="import-row-issue">{issue}</div> : null}
                    </td>
                    <td>{question.subject}</td>
                    <td>{question.topic}</td>
                    <td>{question.difficulty}</td>
                    <td>{question.questionType}</td>
                    <td>
                      <MathText text={question.questionText} />
                    </td>
                    <td>{question.correctAnswers.join(", ")}</td>
                    <td>{question.timerSeconds}s</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {preview.length > 10 ? (
            <p className="table-summary">Showing 10 of {preview.length} parsed rows.</p>
          ) : null}
        </>
      )}
    </main>
  );
}
