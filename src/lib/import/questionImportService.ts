import { addQuestion } from "@/lib/questionService";
import { ImportOptions, ImportReport, ImportQuestion } from "@/types/questionImport";
import { parseQuestionFile } from "./excelParser";
import {
  normalizeFilename,
  readImagesFromZip,
  uploadZipImages,
} from "./imageZipImport";

function getReferencedImages(question: ImportQuestion) {
  return [
    question.questionImage,
    question.optionAImage,
    question.optionBImage,
    question.optionCImage,
    question.optionDImage,
  ]
    .map(normalizeFilename)
    .filter(Boolean);
}

function applyUploadedImageUrls(
  question: ImportQuestion,
  uploadedImages: Map<string, string>
): ImportQuestion {
  const imageUrl = (filename: string) => {
    const normalized = normalizeFilename(filename);
    if (!normalized) return "";
    return uploadedImages.get(normalized) || filename;
  };

  return {
    ...question,
    questionImage: imageUrl(question.questionImage),
    optionAImage: imageUrl(question.optionAImage),
    optionBImage: imageUrl(question.optionBImage),
    optionCImage: imageUrl(question.optionCImage),
    optionDImage: imageUrl(question.optionDImage),
  };
}

export async function importQuestionsWithImages(params: {
  excelFile: File;
  imageZip: File | null;
  options: ImportOptions;
}): Promise<ImportReport> {
  const parsed = await parseQuestionFile({
    file: params.excelFile,
    duplicateMode: params.options.duplicateMode,
    allowDuplicateQuestions: params.options.allowDuplicateQuestions,
  });

  const zipImages = await readImagesFromZip(params.imageZip);

  const { uploaded: uploadedImages, failures: imageUploadFailures } = await uploadZipImages({
    images: zipImages,
    bucket: params.options.bucket,
    folder: params.options.folder ?? "imports",
    replaceExistingImages: params.options.replaceExistingImages,
  });

  const usedImages = new Set<string>();

  const report: ImportReport = {
    questionsFound: parsed.questions.length,
    questionsImported: 0,
    duplicatesSkipped: 0,
    validationSkipped: 0,
    imagesFound: zipImages.size,
    imagesUploaded: uploadedImages.size,
    imageUploadFailures,
    missingImages: [],
    unusedImages: [],
    errors: [],
  };

  for (const question of parsed.questions) {
    try {
      if (question.validationErrors.length > 0) {
        report.validationSkipped += 1;
        continue;
      }

      if (question.duplicateReason) {
        report.duplicatesSkipped += 1;
        continue;
      }

      const referencedImages = getReferencedImages(question);

      for (const filename of referencedImages) {
        usedImages.add(filename);

        if (params.imageZip && !uploadedImages.has(filename)) {
          report.missingImages.push(filename);
        }
      }

      const questionWithUrls = applyUploadedImageUrls(question, uploadedImages);

      const {
        id,
        rowNumber,
        validationErrors,
        duplicateReason,
        ...payload
      } = questionWithUrls;

      await addQuestion(payload);

      report.questionsImported += 1;
    } catch (error) {
      report.errors.push(
        `Row ${question.rowNumber}: ${
          error instanceof Error ? error.message : "Unknown import error"
        }`
      );
    }
  }

  report.unusedImages = [...uploadedImages.keys()].filter(
    (filename) => !usedImages.has(filename)
  );

  report.missingImages = [...new Set(report.missingImages)];

  return report;
}