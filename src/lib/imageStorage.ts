import { supabase } from "./supabaseClient";

const sanitizeFileName = (name: string) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, "-")
        .replace(/-+/g, "-");
};

export async function uploadQuestionImage(file: File | null) {
    if (!file || file.size === 0) return "";

    const safeName = sanitizeFileName(file.name || "image.png");
    const filePath = `questions/${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabase.storage
        .from("question-images")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "image/png",
        });

    if (error) {
        console.error("Supabase upload error:", error);
        console.error("Attempted file path:", filePath);
        throw new Error("Image upload failed");
    }

    const { data } = supabase.storage
        .from("question-images")
        .getPublicUrl(filePath);

    return data.publicUrl;
}