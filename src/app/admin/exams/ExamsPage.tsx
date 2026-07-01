import Link from "next/link";

import Button from "@/components/ui/Button";
import PageTitle from "@/components/ui/PageTitle";
import ExamTable from "@/components/exam/ExamTable";

export default function AdminExamsPage() {
  return (
    <main className="page-container">
      <PageTitle
        title="Exam Management"
        subtitle="Create, manage, archive and restore exams."
      />

      <div className="action-row" style={{ marginBottom: "20px" }}>
        <Link href="/admin/exams/create">
          <Button>Create Exam</Button>
        </Link>

        <Link href="/admin/exams/archived">
          <Button variant="secondary">
            Archived Exams
          </Button>
        </Link>
      </div>

      <ExamTable />
    </main>
  );
}