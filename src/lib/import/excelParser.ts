import * as XLSX from "xlsx";
import { Question } from "@/lib/questionService";
import {
  DuplicateMode,
  ImportQuestion,
  ParsedQuestionFile,
} from "@/types/questionImport";
import { getDuplicateKey, getExistingDuplicateKeys } from "./duplicateDetection";

export const REQUIRED_COLUMNS = [
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

export const OPTIONAL_COLUMNS = [
  "questionImage",
  "optionAImage",
  "optionBImage",
  "optionCImage",
  "optionDImage",
];

export const SUPPORTED_EXTENSIONS = ["xlsx", "xls", "csv"];

const valueAsString = (value: unknown) => String(value ?? "").trim();

const normaliseHeader = (value: string) => value.trim();

const normaliseAnswer = (answer: string) => answer.trim().toUpperCase();

export function validateQuestion(question: ImportQuestion) {
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
  const invalidAnswers = question.correctAnswers.filter(
    (answer) => !allowedAnswers.has(answer)
  );

  if (invalidAnswers.length > 0) {
    errors.push(`Invalid correct answer: ${invalidAnswers.join(", ")}.`);
  }

  if (question.questionType === "single" && question.correctAnswers.length !== 1) {
    errors.push("Single-choice questions must have exactly one correct answer.");
  }

  if (!Number.isFinite(question.timerSeconds) || question.timerSeconds <= 0) {
    errors.push("timerSeconds must be greater than 0.");
  }

  return errors;
}

export async function parseQuestionFile(params: {
  file: File;
  duplicateMode: DuplicateMode;
  allowDuplicateQuestions: boolean;
}): Promise<ParsedQuestionFile> {
  const extension = params.file.name.split(".").pop()?.toLowerCase() || "";

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new Error("Unsupported file type. Please upload .xlsx, .xls or .csv.");
  }

  const buffer = await params.file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!worksheet) {
    throw new Error("The uploaded file does not contain a worksheet.");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  const headerRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: false,
  });

  const headers = (headerRows[0] || []).map((header) =>
    normaliseHeader(String(header))
  );

  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !headers.includes(column)
  );

  const existingKeys = await getExistingDuplicateKeys(params.duplicateMode);

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

    if (!params.allowDuplicateQuestions && params.duplicateMode !== "disable") {
      const key = getDuplicateKey(question, params.duplicateMode);
      const firstFileRow = fileKeys.get(key);

      if (existingKeys.has(key)) {
        question.duplicateReason = "Already exists in question bank.";
      } else if (firstFileRow) {
        question.duplicateReason = `Duplicate of row ${firstFileRow}.`;
      } else {
        fileKeys.set(key, question.rowNumber);
      }
    }

    return question;
  });

  return {
    questions,
    missingColumns,
  };
}