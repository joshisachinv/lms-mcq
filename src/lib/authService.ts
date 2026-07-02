import { supabase } from "@/lib/supabaseClient";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "student";
};

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load user role:", error);
    throw error;
  }

  return data?.role || null;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load user profile:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email || "",
    fullName: data.full_name || data.email || "User",
    role: data.role,
  } as UserProfile;
}