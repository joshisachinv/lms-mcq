"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAsAdmin, signInAsStudent } from "@/lib/authService";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<"admin" | "student" | null>(null);

  const enter = async (role: "admin" | "student") => {
    setLoading(role);
    try {
      const { error } =
        role === "admin" ? await signInAsAdmin() : await signInAsStudent();

      if (error) {
        console.error(`Auto sign-in failed for ${role}:`, error);
        alert(`Could not open the ${role} area: ${error.message}`);
        setLoading(null);
        return;
      }

      router.push(role === "admin" ? "/admin" : "/student");
    } catch (err) {
      console.error("Auto sign-in failed:", err);
      alert("Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <main className="landing-page">
      <section className="landing-panel">
        <p className="landing-eyebrow">MCQ Exam Platform</p>
        <h1 className="landing-title">
          Create, take and review exams professionally.
        </h1>
        <p className="landing-subtitle">
          A clean examination workspace for administrators to manage questions
          and exams, and for students to complete active tests with timers,
          scratchpad and results review.
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => enter("admin")}
            disabled={loading !== null}
          >
            {loading === "admin" ? "Opening..." : "Admin dashboard"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => enter("student")}
            disabled={loading !== null}
          >
            {loading === "student" ? "Opening..." : "Student area"}
          </button>
        </div>
      </section>
    </main>
  );
}
