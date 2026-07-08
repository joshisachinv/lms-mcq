"use client";

import * as XLSX from "xlsx";
import { useCallback, useMemo, useRef, useState } from "react";
import { addQuestion, getQuestions, Question } from "@/lib/questionService";
import { readImagesFromZip, uploadZipImages, normalizeFilename, folderFromZipName } from "@/lib/import/imageZipImport";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageTitle from "@/components/ui/PageTitle";
import Table from "@/components/ui/Table";
import MathText from "@/components/math/MathText";
import { useToast } from "@/components/ui/ToastProvider";

// ─── Types ───────────────────────────────────────────────────────────────────

type ImportQuestion = Question & {
  rowNumber: number;
  validationErrors: string[];
  duplicateReason?: string;
  /** URL resolved from the uploaded ZIP, used only for preview */
  previewQuestionImage?: string;
};

type ImportReport = {
  imported: number;
  skipped: number;
  failed: number;
  imageFailures: string[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  "subject", "topic", "difficulty", "questionType", "questionText",
  "optionA", "optionB", "optionC", "optionD", "correctAnswers",
  "explanation", "timerSeconds",
];

const OPTIONAL_COLUMNS = [
  "questionImage", "optionAImage", "optionBImage", "optionCImage", "optionDImage",
];

const PAGE_SIZE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const str = (v: unknown) => String(v ?? "").trim();
const upper = (s: string) => s.trim().toUpperCase();
const duplicateKey = (q: Pick<Question, "subject" | "topic" | "questionText">) =>
  `${q.subject.trim().toLowerCase()}|${q.topic.trim().toLowerCase()}|${q.questionText.trim().toLowerCase()}`;

function validate(q: ImportQuestion): string[] {
  const errors: string[] = [];
  if (!q.subject) errors.push("Subject is required.");
  if (!q.questionText) errors.push("Question text is required.");
  if (!q.optionA) errors.push("Option A is required.");
  if (!q.optionB) errors.push("Option B is required.");
  if (!q.optionC) errors.push("Option C is required.");
  if (!q.optionD) errors.push("Option D is required.");
  if (!["single", "multiple"].includes(q.questionType))
    errors.push("questionType must be single or multiple.");
  if (q.correctAnswers.length === 0)
    errors.push("At least one correct answer is required.");
  const bad = q.correctAnswers.filter((a) => !["A","B","C","D"].includes(a));
  if (bad.length) errors.push(`Invalid answer(s): ${bad.join(", ")}.`);
  if (q.questionType === "single" && q.correctAnswers.length !== 1)
    errors.push("Single-choice must have exactly one correct answer.");
  if (!Number.isFinite(q.timerSeconds) || q.timerSeconds <= 0)
    errors.push("timerSeconds must be > 0.");
  return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function UploadQuestionsPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef  = useRef<HTMLInputElement>(null);

  const [fileName,        setFileName]        = useState("");
  const [zipName,         setZipName]         = useState("");
  const [isDragging,      setIsDragging]      = useState(false);
  const [missingColumns,  setMissingColumns]  = useState<string[]>([]);
  const [preview,         setPreview]         = useState<ImportQuestion[]>([]);

  // imageZip is kept separately from parsed questions so we only
  // actually upload to Supabase when the user clicks Save.
  const [imageZip,        setImageZip]        = useState<File | null>(null);
  const [imageFolder,     setImageFolder]     = useState("");
  // Object-URL previews keyed by normalised filename — never uploaded yet.
  const [localPreviews,   setLocalPreviews]   = useState<Map<string, string>>(new Map());

  // Duplicate override: set of question IDs the user chose to import anyway.
  const [dupOverrides,    setDupOverrides]    = useState<Set<string>>(new Set());

  const [page,            setPage]            = useState(1);
  const [isSaving,        setIsSaving]        = useState(false);
  const [report,          setReport]          = useState<ImportReport | null>(null);

  // ── Derived counts ──────────────────────────────────────────────────────

  const validQs     = useMemo(() => preview.filter(q => q.validationErrors.length === 0 && !q.duplicateReason), [preview]);
  const dupQs       = useMemo(() => preview.filter(q => !!q.duplicateReason), [preview]);
  const invalidQs   = useMemo(() => preview.filter(q => q.validationErrors.length > 0), [preview]);
  const overriddenQs = useMemo(() => dupQs.filter(q => dupOverrides.has(q.id)), [dupQs, dupOverrides]);

  const toSaveCount  = validQs.length + overriddenQs.length;
  const totalPages   = Math.max(1, Math.ceil(preview.length / PAGE_SIZE));
  const paginated    = preview.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── ZIP handling ────────────────────────────────────────────────────────

  const handleZipChange = async (file: File | null) => {
    setImageZip(file);
    if (!file) { setLocalPreviews(new Map()); setZipName(""); setImageFolder(""); return; }

    setZipName(file.name);
    setImageFolder(folderFromZipName(file.name));
    const images = await readImagesFromZip(file);
    const previews = new Map<string, string>();
    images.forEach((blob, name) => previews.set(name, URL.createObjectURL(blob)));
    setLocalPreviews(previews);
  };

  // ── Excel parsing ───────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    setReport(null);
    setFileName(file.name);
    setDupOverrides(new Set());
    setPage(1);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Unsupported file. Please upload .xlsx, .xls or .csv.");
      return;
    }

    const buf       = await file.arrayBuffer();
    const wb        = XLSX.read(buf, { type: "array" });
    const ws        = wb.Sheets[wb.SheetNames[0]];
    if (!ws) { toast.error("File contains no worksheet."); return; }

    const rows      = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
    const headerRow = (XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false })[0] || []) as unknown[];
    const headers   = headerRow.map(h => str(h));
    setMissingColumns(REQUIRED_COLUMNS.filter(c => !headers.includes(c)));

    const existingQs  = await getQuestions(true);
    const existingKeys = new Set(existingQs.map(duplicateKey));
    const fileKeys     = new Map<string, number>();

    const questions: ImportQuestion[] = rows.map((row, i) => {
      const correctAnswers = str(row.correctAnswers)
        .split(",").map(upper).filter(Boolean);

      const q: ImportQuestion = {
        id:               crypto.randomUUID(),
        rowNumber:        i + 2,
        subject:          str(row.subject),
        topic:            str(row.topic),
        difficulty:       str(row.difficulty)   || "Easy",
        questionType:     str(row.questionType).toLowerCase() || "single",
        questionText:     str(row.questionText),
        questionImage:    str(row.questionImage),
        optionA:          str(row.optionA),
        optionAImage:     str(row.optionAImage),
        optionB:          str(row.optionB),
        optionBImage:     str(row.optionBImage),
        optionC:          str(row.optionC),
        optionCImage:     str(row.optionCImage),
        optionD:          str(row.optionD),
        optionDImage:     str(row.optionDImage),
        correctAnswers,
        explanation:      str(row.explanation),
        timerSeconds:     Number(str(row.timerSeconds) || 60),
        isArchived:       false,
        validationErrors: [],
      };

      q.validationErrors = validate(q);

      const key = duplicateKey(q);
      if (existingKeys.has(key)) {
        q.duplicateReason = "Already exists in question bank.";
      } else if (fileKeys.has(key)) {
        q.duplicateReason = `Duplicate of row ${fileKeys.get(key)}.`;
      } else {
        fileKeys.set(key, q.rowNumber);
      }

      return q;
    });

    setPreview(questions);
  }, []);

  // ── File input handlers ─────────────────────────────────────────────────

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  };

  const reset = () => {
    setPreview([]); setFileName(""); setMissingColumns([]);
    setReport(null); setDupOverrides(new Set()); setPage(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Duplicate override controls ─────────────────────────────────────────

  const toggleOverride = (id: string) =>
    setDupOverrides(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allDupsSelected = dupQs.length > 0 && dupQs.every(q => dupOverrides.has(q.id));

  const toggleAllDups = () => {
    if (allDupsSelected) {
      setDupOverrides(new Set());
    } else {
      setDupOverrides(new Set(dupQs.map(q => q.id)));
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────

  const save = async () => {
    if (toSaveCount === 0) {
      toast.error("No questions to save. Resolve validation issues or select duplicate overrides.");
      return;
    }

    setIsSaving(true);
    let imported = 0, skipped = 0, failed = 0;

    try {
      // Upload images first so we have public URLs to attach to questions.
      let uploadedImages = new Map<string, string>();
      const imageFailures: string[] = [];

      if (imageZip) {
        const blobs = await readImagesFromZip(imageZip);
        const result = await uploadZipImages({
          images: blobs,
          bucket: "question-images",
          folder: imageFolder || "imports",
          replaceExistingImages: true,
        });
        uploadedImages = result.uploaded;
        imageFailures.push(...result.failures);
      }

      const resolveImage = (filename: string) => {
        const norm = normalizeFilename(filename);
        return norm ? (uploadedImages.get(norm) || filename) : "";
      };

      const toSave = [
        ...validQs,
        ...overriddenQs,
      ];

      for (const q of toSave) {
        try {
          const { id, rowNumber, validationErrors, duplicateReason, previewQuestionImage, ...payload } = q;
          await addQuestion({
            ...payload,
            questionImage:  resolveImage(q.questionImage),
            optionAImage:   resolveImage(q.optionAImage),
            optionBImage:   resolveImage(q.optionBImage),
            optionCImage:   resolveImage(q.optionCImage),
            optionDImage:   resolveImage(q.optionDImage),
          });
          imported++;
        } catch (err) {
          console.error(`Row ${q.rowNumber}:`, err);
          failed++;
        }
      }

      skipped = preview.length - imported - failed;
      setReport({ imported, skipped, failed, imageFailures });

      if (failed === 0) {
        setPreview([]);
        setDupOverrides(new Set());
        setPage(1);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Row status helpers ──────────────────────────────────────────────────

  const rowStatus = (q: ImportQuestion) => {
    if (q.validationErrors.length > 0) return "invalid";
    if (q.duplicateReason)             return "duplicate";
    return "valid";
  };

  const previewImage = (filename: string) => {
    const norm = normalizeFilename(filename);
    return norm ? (localPreviews.get(norm) || "") : "";
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="page-container">
      <PageTitle
        title="Import Questions"
        subtitle="Upload Excel or CSV to preview, validate, and save questions. Optionally attach a ZIP of images."
      />

      {/* ── Upload card ── */}
      <Card className="form-card upload-card">
        {/* Excel dropzone */}
        <div
          className={`upload-dropzone ${isDragging ? "upload-dropzone-active" : ""}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <div>
            <h2>Drag & drop your question file</h2>
            <p>Supported: Excel .xlsx, .xls and CSV .csv</p>
          </div>
          <div className="action-row">
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
            {(preview.length > 0 || fileName) && (
              <Button type="button" variant="secondary" onClick={reset}>
                Clear
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="visually-hidden"
            accept=".xlsx,.xls,.csv"
            onChange={onFileChange}
          />
        </div>

        {/* Column reference */}
        <div className="import-help-grid">
          <div>
            <strong>Required columns</strong>
            <p>{REQUIRED_COLUMNS.join(", ")}</p>
          </div>
          <div>
            <strong>Optional image columns</strong>
            <p>{OPTIONAL_COLUMNS.join(", ")} — filenames that match images in the ZIP</p>
          </div>
        </div>

        {/* Image ZIP section */}
        <div className="import-zip-row">
          <div>
            <strong>Image ZIP</strong>
            <p>
              Upload a ZIP of images. Filenames in the ZIP are matched to the
              optional image columns in your Excel file. Images are uploaded to
              Supabase when you click Save.
            </p>
          </div>
          <div className="import-zip-controls">
            <Button
              type="button"
              variant="secondary"
              onClick={() => zipInputRef.current?.click()}
            >
              {zipName ? "Replace ZIP" : "Choose ZIP"}
            </Button>
            {zipName && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setImageZip(null); setLocalPreviews(new Map()); setZipName(""); if (zipInputRef.current) zipInputRef.current.value = ""; }}
              >
                Remove
              </Button>
            )}
            <input
              ref={zipInputRef}
              type="file"
              className="visually-hidden"
              accept=".zip"
              onChange={e => handleZipChange(e.target.files?.[0] || null)}
            />
          </div>
          {zipName && (
            <p className="import-zip-info">
              📦 {zipName} — {localPreviews.size} image{localPreviews.size !== 1 ? "s" : ""} found
            </p>
          )}
          {zipName && (
            <div className="import-zip-folder">
              <label className="form-label" htmlFor="image-folder">
                Upload folder
                <span className="import-zip-folder-hint">
                  Images will be saved to <code>question-images / <strong>{imageFolder || "imports"}</strong></code>
                </span>
              </label>
              <input
                id="image-folder"
                className="form-input"
                value={imageFolder}
                placeholder="imports"
                onChange={e =>
                  setImageFolder(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-_/]/g, "-")
                      .replace(/-{2,}/g, "-")
                  )
                }
              />
            </div>
          )}
        </div>
      </Card>

      {/* ── Status messages ── */}
      {fileName && <p className="table-summary">File: {fileName}</p>}

      {missingColumns.length > 0 && (
        <div className="import-alert import-alert-danger">
          <strong>Missing required columns:</strong> {missingColumns.join(", ")}
        </div>
      )}

      {report && (
        <>
          <div className="import-report">
            <span>✅ Imported: {report.imported}</span>
            <span>⏭ Skipped: {report.skipped}</span>
            {report.failed > 0 && <span>❌ Failed: {report.failed}</span>}
            {report.imageFailures.length > 0 && (
              <span>🖼 Image errors: {report.imageFailures.length}</span>
            )}
          </div>
          {report.imageFailures.length > 0 && (
            <div className="import-alert import-alert-danger">
              <strong>Some images could not be uploaded</strong> — questions were
              still imported without them. Check your Supabase storage bucket
              policies for <code>question-images</code>.
              <ul>
                {report.imageFailures.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </>
      )}

      {/* ── Preview ── */}
      {preview.length === 0 ? (
        <EmptyState message="No file uploaded yet." />
      ) : (
        <>
          {/* Summary cards */}
          <div className="import-summary-grid">
            <Card className="import-summary-card import-summary-valid">
              <span>{validQs.length}</span>
              <p>ready to import</p>
            </Card>
            <Card className="import-summary-card import-summary-warning">
              <span>{dupQs.length}</span>
              <p>
                duplicates
                {dupQs.length > 0 && (
                  <button
                    type="button"
                    className="import-dup-toggle"
                    onClick={toggleAllDups}
                  >
                    {allDupsSelected ? "deselect all" : "select all"}
                  </button>
                )}
              </p>
            </Card>
            <Card className="import-summary-card import-summary-danger">
              <span>{invalidQs.length}</span>
              <p>validation errors</p>
            </Card>
          </div>

          {/* Duplicate override notice */}
          {dupQs.length > 0 && (
            <div className="import-alert import-alert-warning">
              <strong>{overriddenQs.length} of {dupQs.length} duplicate{dupQs.length !== 1 ? "s" : ""} selected for override.</strong>
              {" "}Check the box in the Duplicate column to import a duplicate anyway.
            </div>
          )}

          {/* Save button row */}
          <div className="section-heading-row">
            <h2>Preview — {preview.length} rows parsed</h2>
            <Button
              type="button"
              onClick={save}
              disabled={isSaving || toSaveCount === 0}
            >
              {isSaving ? "Saving…" : `Save ${toSaveCount} Question${toSaveCount !== 1 ? "s" : ""}`}
            </Button>
          </div>

          {/* Question table */}
          <Table>
            <thead>
              <tr>
                <th>Row</th>
                <th>Status</th>
                <th>Subject / Topic</th>
                <th>Question</th>
                <th>Image</th>
                <th>Type</th>
                <th>Correct</th>
                <th>Timer</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(q => {
                const status = rowStatus(q);
                const imgSrc = previewImage(q.questionImage);
                const issue  = q.validationErrors[0] || q.duplicateReason;

                return (
                  <tr key={q.id} className={status === "invalid" ? "import-row-error" : ""}>
                    <td>{q.rowNumber}</td>

                    <td>
                      {status === "valid" && (
                        <span className="badge badge-green">Valid</span>
                      )}
                      {status === "duplicate" && (
                        <label className="import-override-label">
                          <input
                            type="checkbox"
                            checked={dupOverrides.has(q.id)}
                            onChange={() => toggleOverride(q.id)}
                          />
                          <span className="badge badge-yellow">Duplicate</span>
                        </label>
                      )}
                      {status === "invalid" && (
                        <span className="badge badge-red">Issue</span>
                      )}
                      {issue && (
                        <div className="import-row-issue">{issue}</div>
                      )}
                    </td>

                    <td>
                      <strong>{q.subject}</strong>
                      {q.topic && <div className="import-row-topic">{q.topic}</div>}
                    </td>

                    <td className="import-row-question">
                      <MathText text={q.questionText} />
                    </td>

                    <td>
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt="Question"
                          className="import-preview-img"
                        />
                      ) : q.questionImage ? (
                        <span className="import-img-missing" title={q.questionImage}>
                          ⚠ not in ZIP
                        </span>
                      ) : (
                        <span className="import-img-none">—</span>
                      )}
                    </td>

                    <td>{q.questionType}</td>
                    <td>{q.correctAnswers.join(", ")}</td>
                    <td>{q.timerSeconds}s</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="import-pagination">
              <button
                type="button"
                className="import-page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  className={`import-page-btn ${p === page ? "import-page-active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="import-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next ›
              </button>

              <span className="import-page-info">
                Page {page} of {totalPages} · {preview.length} rows
              </span>
            </div>
          )}
        </>
      )}
    </main>
  );
}
