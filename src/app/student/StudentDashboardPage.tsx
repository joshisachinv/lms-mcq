import Link from "next/link";

export default function StudentDashboardPage() {
  return (
    <main className="page-container">
      <h1>Student Dashboard</h1>
      <p>Take active exams and review your previous results.</p>

      <div className="card-grid">
        <div className="dashboard-card">
          <h3>Take Exam</h3>
          <p>View available active exams and start a test.</p>
          <br />
          <Link className="primary-button" href="/student/exams">
            View Exams
          </Link>
        </div>

        <div className="dashboard-card">
          <h3>My Results</h3>
          <p>Review scores, answers, timing, and scratchpad work.</p>
          <br />
          <Link className="primary-button" href="/student/results">
            Review Results
          </Link>
        </div>
      </div>
    </main>
  );
}