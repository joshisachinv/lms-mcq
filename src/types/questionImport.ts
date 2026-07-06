import { Question } from "@/lib/questionService";

export type DuplicateMode =
  | "subjectTopicQuestionText"
  | "questionTextOnly"
  | "questionImage"
  | "disable";

export type ImportOptions = {
  bucket: string;
  folder?: string;
  autoMatchFilenames: boolean;
  replaceExistingImages: boolean;
  allowDuplicateQuestions: boolean;
  duplicateMode: DuplicateMode;
};

export type ImportQuestion = Question & {
  rowNumber: number;
  validationErrors: string[];
  duplicateReason?: string;
};

export type ParsedQuestionFile = {
  questions: ImportQuestion[];
  missingColumns: string[];
};

export type ImportReport = {
  questionsFound: number;
  questionsImported: number;
  duplicatesSkipped: number;
  validationSkipped: number;
  imagesFound: number;
  imagesUploaded: number;
  imageUploadFailures: string[];
  missingImages: string[];
  unusedImages: string[];
  errors: string[];
};