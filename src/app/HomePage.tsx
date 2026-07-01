import Link from "next/link";

export default function HomePage() {
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
          <Link className="primary-button" href="/admin">
            Admin dashboard
          </Link>
          <Link className="secondary-button" href="/student">
            Student area
          </Link>
        </div>
      </section>
    </main>
  );
}
