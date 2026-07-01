"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getExamById, updateExam, Exam } from "@/lib/examService";
import { getQuestions, Question } from "@/lib/questionService";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import DataTable from "@/components/datatable/DataTable";

export default function EditExamPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const examId = params.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const questionData = await getQuestions();
        const foundExam = await getExamById(examId);

        setExam(foundExam);
        setQuestions(questionData);
      } catch (error) {
        console.error(error);
        alert("Failed to load exam.");
        setExam(null);
      }
    };

    loadData();
  }, [examId]);

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    if (!exam) return;

    const currentIndex = exam.questionIds.indexOf(questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= exam.questionIds.length) return;

    const updatedQuestionIds = [...exam.questionIds];
    const [movedQuestion] = updatedQuestionIds.splice(currentIndex, 1);
    updatedQuestionIds.splice(newIndex, 0, movedQuestion);

    updateField("questionIds", updatedQuestionIds);
  };
  
  const updateField = (
    field: keyof Exam,
    value: string | number | boolean | string[]
  ) => {
    if (!exam) return;

    setExam({
      ...exam,
      [field]: value,
    });
  };

  const toggleQuestion = (questionId: string) => {
    if (!exam) return;

    const exists = exam.questionIds.includes(questionId);

    updateField(
      "questionIds",
      exists
        ? exam.questionIds.filter((id) => id !== questionId)
        : [...exam.questionIds, questionId]
    );
  };

  const saveChanges = async () => {
    if (!exam) return;

    if (!exam.title.trim()) {
      alert("Please enter an exam title.");
      return;
    }

    if (exam.questionIds.length === 0) {
      alert("Please select at least one question.");
      return;
    }

    try {
      setSaving(true);
      await updateExam(exam);
      alert("Exam updated.");
      router.push("/admin/exams");
    } catch (error) {
      console.error(error);
      alert("Failed to update exam.");
    } finally {
      setSaving(false);
    }
  };

  if (!exam) {
    return (
      <main className="page-container">
        <PageTitle title="Edit Exam" subtitle="Exam not found." />
      </main>
    );
  }

  return (
    <main className="page-container">
      <PageTitle
        title="Edit Exam"
        subtitle="Modify exam details and selected questions."
      />

      <Card className="form-card">
        <div className="form-grid">
          <FormSection title="Exam Details">
            <div className="form-grid">
              <Input
                label="Exam Title"
                value={exam.title}
                onChange={(e) => updateField("title", e.target.value)}
              />

              <Textarea
                label="Description"
                value={exam.description}
                onChange={(e) => updateField("description", e.target.value)}
              />

              <Input
                label="Overall Timer Seconds"
                type="number"
                value={exam.overallTimerSeconds}
                onChange={(e) =>
                  updateField("overallTimerSeconds", Number(e.target.value))
                }
              />

              <Select
                label="Status"
                value={exam.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  updateField("isActive", e.target.value === "active")
                }
              >
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
              </Select>

              <Select
                label="Randomize Questions"
                value={exam.randomizeQuestions ? "yes" : "no"}
                onChange={(e) =>
                  updateField("randomizeQuestions", e.target.value === "yes")
                }
              >
                <option value="no">No - Use manual order</option>
                <option value="yes">Yes - Randomize for student</option>
              </Select>

              <Select
                label="Timing Mode"
                value={exam.isTimed ? "timed" : "untimed"}
                onChange={(e) => updateField("isTimed", e.target.value === "timed")}
              >
                <option value="timed">Timed - enforce time limits</option>
                <option value="untimed">Untimed - track time only</option>
              </Select>
            </div>
          </FormSection>

          <FormSection title={`Questions (${exam.questionIds.length} selected)`}>
            {questions.length === 0 ? (
              <EmptyState message="No questions available." />
            ) : (
              <DataTable
                data={questions}
                getRowKey={(question) => question.id}
                columns={[
                  {
                    key: "select",
                    label: "Selected",
                    filter: true,
                    sortable: true,
                    getValue: (question) =>
                      exam.questionIds.includes(question.id) ? "Selected" : "Not Selected",
                    render: (question) => (
                      <input
                        type="checkbox"
                        checked={exam.questionIds.includes(question.id)}
                        onChange={() => toggleQuestion(question.id)}
                      />
                    ),
                  },
                  
                  {
                    key: "order",
                    label: "Order",
                    getValue: (question) => {
                      const index = exam.questionIds.indexOf(question.id);
                      return index === -1 ? "Not selected" : String(index + 1);
                    },
                    filter: true,
                    sortable: true,
                    render: (question) => {
                      const index = exam.questionIds.indexOf(question.id);

                      if (index === -1) {
                        return "-";
                      }

                      return (
                        <div className="action-row">
                          <span>{index + 1}</span>

                          <Button
                            type="button"
                            variant="secondary"
                            disabled={index === 0}
                            onClick={() => moveQuestion(question.id, "up")}
                          >
                            ↑
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            disabled={index === exam.questionIds.length - 1}
                            onClick={() => moveQuestion(question.id, "down")}
                          >
                            ↓
                          </Button>
                        </div>
                      );
                    },
                  },
                  
                  {
                    key: "subject",
                    label: "Subject",
                    filter: true,
                    sortable: true,
                  },
                  {
                    key: "topic",
                    label: "Topic",
                    filter: true,
                    sortable: true,
                  },
                  {
                    key: "difficulty",
                    label: "Difficulty",
                    filter: true,
                    sortable: true,
                  },
                  {
                    key: "questionText",
                    label: "Question",
                    sortable: true,
                  },
                ]}
              />
            )}
          </FormSection>

          <div className="action-row">
            <Button type="button" onClick={saveChanges} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/exams")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}