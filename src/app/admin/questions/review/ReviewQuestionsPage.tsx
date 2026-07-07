"use client";

import Link from "next/link";
import QuestionReviewTable from "@/components/questions/QuestionReviewTable";
import Button from "@/components/ui/Button";
import PageTitle from "@/components/ui/PageTitle";

export default function ReviewQuestionsPage() {
  return (
    <main className="page-container">
      <PageTitle
        title="Review Questions"
        subtitle="See how each question has performed across every exam attempt: how often it's been tried, how often it's answered correctly, and how long students take on it."
      />

      <div className="action-row">
        <Link href="/admin/questions">
          <Button type="button" variant="secondary">
            Back to Question Bank
          </Button>
        </Link>

        <Link href="/admin/results">
          <Button type="button" variant="secondary">
            View Exam Results
          </Button>
        </Link>
      </div>

      <QuestionReviewTable />
    </main>
  );
}
