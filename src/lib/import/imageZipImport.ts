import JSZip from "jszip";
import { supabase } from "@/lib/supabaseClient";

export function normalizeFilename(value: string) {
  return String(value || "")
    .trim()
    .split("/")
    .pop()
    ?.toLowerCase() || "";
}

/** Converts a zip filename like "Biology Chapter 3.zip" → "biology-chapter-3" */
export function folderFromZipName(zipFilename: string) {
  return zipFilename
    .replace(/\.zip$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function readImagesFromZip(zipFile: File | null) {
  const images = new Map<string, Blob>();

  if (!zipFile) return images;

  const zip = await JSZip.loadAsync(await zipFile.arrayBuffer());

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;

    const filename = normalizeFilename(path);

    if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(filename)) continue;

    const blob = await entry.async("blob");
    images.set(filename, blob);
  }

  return images;
}

export async function uploadZipImages(params: {
  images: Map<string, Blob>;
  bucket: string;
  folder: string;           // e.g. "biology-chapter-3"
  replaceExistingImages: boolean;
}) {
  const uploaded = new Map<string, string>();
  const failures: string[] = [];

  for (const [filename, blob] of params.images.entries()) {
    const path = `${params.folder}/${filename}`;

    const { error } = await supabase.storage
      .from(params.bucket)
      .upload(path, blob, {
        upsert: params.replaceExistingImages,
        contentType: blob.type || "image/png",
      });

    if (error) {
      console.error(`Image upload failed for ${path}:`, error.message);
      failures.push(`${filename}: ${error.message}`);
      continue;
    }

    const { data } = supabase.storage.from(params.bucket).getPublicUrl(path);
    uploaded.set(filename, data.publicUrl);
  }

  return { uploaded, failures };
}
