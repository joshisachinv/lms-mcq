import * as XLSX from "xlsx";
import JSZip from "jszip";
import { supabase } from "@/lib/supabaseClient";

type ImportOptions = {
  excelFile: File;
  imageZip: File | null;
  bucket: string;
  autoMatchFilenames: boolean;
  replaceExistingImages: boolean;
  allowDuplicateQuestions: boolean;
};

export type ImportReport = {
  questionsFound: number;
  questionsImported: number;
  duplicatesSkipped: number;
  imagesFound: number;
  imagesUploaded: number;
  missingImages: string[];
  unusedImages: string[];
  errors: string[];
};

type ExcelRow = {
  subject?: string;
  topic?: string;
  difficulty?: string;
  question_text?: string;
  question_image?: string;
  question_type?: string;
  option_a?: string;
  option_a_image?: string;
  option_b?: string;
  option_b_image?: string;
  option_c?: string;
  option_c_image?: string;
  option_d?: string;
  option_d_image?: string;
  correct_answer?: string;
  explanation?: string;
  timer_seconds?: number;
};

const normalizeFilename = (value?: string) =>
  String(value || "")
    .trim()
    .split("/")
    .pop()
    ?.toLowerCase() || "";

const normalizeText = (value?: string) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

async function readExcelRows(file: File): Promise<ExcelRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "" });
}

async function readZipImages(zipFile: File | null) {
  const images = new Map<string, Blob>();

  if (!zipFile) return images;

  const zip = await JSZip.loadAsync(await zipFile.arrayBuffer());

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;

    const filename = normalizeFilename(path);
    const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(filename);

    if (!isImage) continue;

    const blob = await entry.async("blob");
    images.set(filename, blob);
  }

  return images;
}

async function uploadImages(params: {
  imageMap: Map<string, Blob>;
  bucket: string;
  replaceExistingImages: boolean;
}) {
  const uploaded = new Map<string, string>();

  for (const [filename, blob] of params.imageMap.entries()) {
    const storagePath = `imports/${filename}`;

    const { error } = await supabase.storage
      .from(params.bucket)
      .upload(storagePath, blob, {
        upsert: params.replaceExistingImages,
        contentType: blob.type || "image/png",
      });

    if (error) {
      throw new Error(`Image upload failed for ${filename}: ${error.message}`);
    }

    uploaded.set(filename, getPublicUrl(params.bucket, storagePath));
  }

  return uploaded;
}

async function isDuplicateQuestion(row: ExcelRow) {
  const questionText = normalizeText(row.question_text);
  const subject = normalizeText(row.subject);
  const topic = normalizeText(row.topic);

  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("question_text", row.question_text || "")
    .eq("subject", row.subject || "")
    .eq("topic", row.topic || "")
    .limit(1);

  if (error) throw error;

  return Boolean(data && data.length > 0 && questionText && subject);
}

function correctLabels(value?: string) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
}

function imageUrlFor(filename: string | undefined, uploadedImages: Map<string, string>) {
  const normalized = normalizeFilename(filename);
  if (!normalized) return "";
  return uploadedImages.get(normalized) || "";
}

export async function importQuestionsWithImages(options: ImportOptions): Promise<ImportReport> {
  const rows = await readExcelRows(options.excelFile);
  const imageMap = await readZipImages(options.imageZip);
  const uploadedImages = await uploadImages({
    imageMap,
    bucket: options.bucket,
    replaceExistingImages: options.replaceExistingImages,
  });

  const usedImages = new Set<string>();

  const report: ImportReport = {
    questionsFound: rows.length,
    questionsImported: 0,
    duplicatesSkipped: 0,
    imagesFound: imageMap.size,
    imagesUploaded: uploadedImages.size,
    missingImages: [],
    unusedImages: [],
    errors: [],
  };

  for (const row of rows) {
    try {
      if (!row.question_text) {
        report.errors.push("Skipped row without question_text.");
        continue;
      }

      if (!options.allowDuplicateQuestions) {
        const duplicate = await isDuplicateQuestion(row);
        if (duplicate) {
          report.duplicatesSkipped += 1;
          continue;
        }
      }

      const imageFields = [
        row.question_image,
        row.option_a_image,
        row.option_b_image,
        row.option_c_image,
        row.option_d_image,
      ];

      for (const imageName of imageFields) {
        const normalized = normalizeFilename(imageName);
        if (!normalized) continue;

        usedImages.add(normalized);

        if (!uploadedImages.has(normalized)) {
          report.missingImages.push(normalized);
        }
      }

      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert({
          subject: row.subject || "General",
          topic: row.topic || "",
          difficulty: row.difficulty || "",
          question_text: row.question_text,
          question_image_url: imageUrlFor(row.question_image, uploadedImages),
          question_type: row.question_type || "single",
          explanation: row.explanation || "",
          default_time_seconds: Number(row.timer_seconds || 60),
        })
        .select("id")
        .single();

      if (questionError) throw questionError;

      const correct = correctLabels(row.correct_answer);

      const optionsToInsert = [
        {
          question_id: question.id,
          option_label: "A",
          option_text: row.option_a || "",
          option_image_url: imageUrlFor(row.option_a_image, uploadedImages),
          is_correct: correct.includes("A"),
        },
        {
          question_id: question.id,
          option_label: "B",
          option_text: row.option_b || "",
          option_image_url: imageUrlFor(row.option_b_image, uploadedImages),
          is_correct: correct.includes("B"),
        },
        {
          question_id: question.id,
          option_label: "C",
          option_text: row.option_c || "",
          option_image_url: imageUrlFor(row.option_c_image, uploadedImages),
          is_correct: correct.includes("C"),
        },
        {
          question_id: question.id,
          option_label: "D",
          option_text: row.option_d || "",
          option_image_url: imageUrlFor(row.option_d_image, uploadedImages),
          is_correct: correct.includes("D"),
        },
      ].filter((option) => option.option_text || option.option_image_url);

      const { error: optionError } = await supabase
        .from("question_options")
        .insert(optionsToInsert);

      if (optionError) throw optionError;

      report.questionsImported += 1;
    } catch (error) {
      report.errors.push(error instanceof Error ? error.message : "Unknown import error.");
    }
  }

  report.unusedImages = [...uploadedImages.keys()].filter((filename) => !usedImages.has(filename));

  return report;
}