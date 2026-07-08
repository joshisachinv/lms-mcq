import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Demo "one-click" sign-in used by the landing page's "Admin dashboard" /
 * "Student area" buttons.
 *
 * This runs ONLY on the server. The demo credentials are read from
 * server-only environment variables (no NEXT_PUBLIC_ prefix), so they are
 * never bundled into client-side JavaScript and can't be read from the
 * browser's dev tools or network tab.
 *
 * Required server env vars (set these in Vercel / your host, NOT prefixed
 * with NEXT_PUBLIC_):
 *   DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD
 *   DEMO_STUDENT_EMAIL, DEMO_STUDENT_PASSWORD
 *
 * If you don't want a "one-click demo login" feature at all in production,
 * simply delete this route and the two buttons on the landing page.
 */

// A plain anon-key client is fine here: signInWithPassword() only needs the
// anon key, and we never touch a service-role key in this route.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  let role: unknown;

  try {
    const body = await request.json();
    role = body?.role;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (role !== "admin" && role !== "student") {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const email =
    role === "admin"
      ? process.env.DEMO_ADMIN_EMAIL
      : process.env.DEMO_STUDENT_EMAIL;
  const password =
    role === "admin"
      ? process.env.DEMO_ADMIN_PASSWORD
      : process.env.DEMO_STUDENT_PASSWORD;

  if (!email || !password) {
    console.error(`Demo login is not configured for role: ${role}`);
    return NextResponse.json(
      { error: "Demo login is not configured on the server." },
      { status: 500 }
    );
  }

  // A fresh client per request avoids sharing session state across requests.
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    console.error(`Demo login failed for role ${role}:`, error);
    // Deliberately generic — never echo back Supabase's raw error message,
    // which could hint at valid emails/passwords to a client.
    return NextResponse.json(
      { error: "Demo login is temporarily unavailable." },
      { status: 401 }
    );
  }

  // Only the session tokens go back to the browser — never the password.
  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}
