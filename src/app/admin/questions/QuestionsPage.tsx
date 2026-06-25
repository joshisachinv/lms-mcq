import Link from "next/link";
import QuestionTable from "@/components/questions/QuestionTable";
import Button from "@/components/ui/Button";
import PageTitle from "@/components/ui/PageTitle";

export default function Page() {
  return (
    <main className="page-container">
      <PageTitle
        title="Question Bank"
        subtitle="Search, filter, duplicate, archive, and edit questions."
      />

      <div className="action-row" style={{ marginBottom: "16px" }}>
        <Link href="/admin/questions/add">
          <Button type="button">Add Question</Button>
        </Link>

        <Link href="/admin/questions/upload">
          <Button type="button" variant="secondary">
            Upload Excel
          </Button>
        </Link>

        <Link href="/admin/questions/archived">
          <Button type="button" variant="secondary">
            Archived Questions
          </Button>
        </Link>
      </div>

      <QuestionTable />
    </main>
  );
}