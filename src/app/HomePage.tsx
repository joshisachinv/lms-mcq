"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  
  const enter = (role: "admin" | "student") => {
    router.push(`/login?role=${role}`);
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
            className="primary-button"
            onClick={() => enter("admin")}
          >
            Admin Dashboard
          </button>

          <button
            className="secondary-button"
            onClick={() => enter("student")}
          >
            Student Area
          </button>
          
        </div>
      </section>
    </main>
  );
}
