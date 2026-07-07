import Link from "next/link";
import PageTitle from "@/components/ui/PageTitle";

export default function AdminDashboardPage() {
  return (
    <main className="page-container">
      <PageTitle
        title="Admin Dashboard"
        subtitle="Manage questions, exams, and results."
      />

      <div className="card-grid">
        <div className="dashboard-card">
          <h3>Questions</h3>
          <p>Create, edit, upload, and manage your question bank.</p>
          <br />
          <Link className="primary-button" href="/admin/questions">
            Manage Questions
          </Link>
        </div>

        <div className="dashboard-card">
          <h3>Exams</h3>
          <p>Create exams, select questions, and activate tests.</p>
          <br />
          <Link className="primary-button" href="/admin/exams">
            Manage Exams
          </Link>
        </div>

        <div className="dashboard-card">
          <h3>Results</h3>
          <p>Review student attempts, scores, and scratchpads.</p>
          <br />
          <Link className="primary-button" href="/admin/results">
            View Results
          </Link>
        </div>
      </div>
    </main>
  );
}