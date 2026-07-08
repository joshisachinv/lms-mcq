"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  archiveExam,
  duplicateExam,
  getExams,
  toggleExamActive,
  Exam,
} from "@/lib/examService";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DataTable from "@/components/datatable/DataTable";

export default function ExamTable() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleShareExam = async (exam: Exam) => {
  const examUrl = `${window.location.origin}/student/exams/take/${exam.id}`;

    try {
      await navigator.clipboard.writeText(examUrl);
      toast.success(`Exam link copied: ${examUrl}`);
    } catch (error) {
      console.error(error);
      prompt("Copy link:", examUrl);
    }
  };
  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await getExams();
      setExams(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const filteredExams = exams.filter((exam) => {
    const searchableText = `${exam.title} ${exam.description}`.toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? exam.isActive
          : !exam.isActive;

    return matchesSearch && matchesStatus;
  });

  const handleToggleActive = async (exam: Exam) => {
    try {
      await toggleExamActive(exam.id, !exam.isActive);
      await loadExams();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update exam status.");
    }
  };

  const handleArchive = async (id: string) => {
    const confirmed = confirm("Archive this exam?");
    if (!confirmed) return;

    try {
      await archiveExam(id);
      await loadExams();
    } catch (error) {
      console.error(error);
      toast.error("Failed to archive exam.");
    }
  };

  const handleDuplicate = async (exam: Exam) => {
    try {
      await duplicateExam(exam);
      await loadExams();
    } catch (error) {
      console.error(error);
      toast.error("Failed to duplicate exam.");
    }
  };

  if (loading) {
    return <p>Loading exams...</p>;
  }

  if (exams.length === 0) {
    return <EmptyState message="No exams created yet." />;
  }

  return (
    <>
      <div className="form-card filter-panel">
        <div className="form-grid">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exam title or description"
          />

          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All exams</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </Select>
        </div>
      </div>

      {filteredExams.length === 0 ? (
        <EmptyState message="No exams match your search or filters." />
      ) : (
        <DataTable
        data={filteredExams}
        getRowKey={(exam) => exam.id}
        columns={[
          {
            key: "title",
            label: "Title",
            filter: true,
            sortable: true,
          },
          {
            key: "description",
            label: "Description",
            sortable: true,
          },
          {
            key: "questionCount",
            label: "Questions",
            filter: true,
            sortable: true,
            getValue: (exam) => exam.questionIds.length,
          },
          {
            key: "overallTimerSeconds",
            label: "Timer",
            sortable: true,
            getValue: (exam) => `${exam.overallTimerSeconds}s`,
          },
          {
            key: "status",
            label: "Status",
            filter: true,
            sortable: true,
            getValue: (exam) => (exam.isActive ? "Active" : "Inactive"),
            render: (exam) => (
              <Badge color={exam.isActive ? "green" : "gray"}>
                {exam.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (exam) => (
              <div className="action-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleToggleActive(exam)}
                >
                  {exam.isActive ? "Deactivate" : "Activate"}
                </Button>

                <Link href={`/admin/exams/edit/${exam.id}`}>
                  <Button type="button" variant="secondary">
                    Edit
                  </Button>
                </Link>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleDuplicate(exam)}
                >
                  Duplicate
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  disabled={!exam.isActive}
                  onClick={() => handleShareExam(exam)}
                >
                  Share Link
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={() => handleArchive(exam.id)}
                >
                  Archive
                </Button>
              </div>
            ),
          }
        ]}
      />
      )}
    </>
  );
}