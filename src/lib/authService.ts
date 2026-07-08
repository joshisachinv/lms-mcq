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

/**
 * "One-click demo" sign-in used by the landing page. The actual credentials
 * never reach the browser: they live only in server-only env vars read by
 * /api/auth/demo-login, which returns just a session for us to adopt.
 */
async function signInWithDemoRole(role: "admin" | "student") {
  const response = await fetch("/api/auth/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      data: { user: null, session: null },
      error: new Error(body?.error || "Demo login failed."),
    };
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  });

  return { data, error };
}

export async function signInAsAdmin() {
  return signInWithDemoRole("admin");
}

export async function signInAsStudent() {
  return signInWithDemoRole("student");
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