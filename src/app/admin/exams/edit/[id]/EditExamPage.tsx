"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ExamDetailsForm from "@/components/exams/edit/ExamDetailsForm"
import QuestionBankFilters from "@/components/exams/edit/QuestionBankFilters";
import ExamQuestionTable from "@/components/exams/edit/ExamQuestionTable";
import ExamEditActions from "@/components/exams/edit/ExamEditActions";
import { getExamById, updateExam, Exam } from "@/lib/examService";
import { getQuestions, Question } from "@/lib/questionService";
import Card from "@/components/ui/Card";
import PageTitle from "@/components/ui/PageTitle";

export default function EditExamPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const examId = params.id;
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [isTimed, setIsTimed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("selected");
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
  
  const subjects = Array.from(
    new Set(questions.map((question) => question.subject).filter(Boolean))
  );

  const topics = Array.from(
    new Set(questions.map((question) => question.topic).filter(Boolean))
  );
  
  const filteredQuestions = questions.filter((question) => {
    const searchableText = `
      ${question.subject}
      ${question.topic}
      ${question.difficulty}
      ${question.questionText}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());

    const matchesSubject =
      subjectFilter === "" || question.subject === subjectFilter;

    const matchesTopic =
      topicFilter === "" || question.topic === topicFilter;

    const matchesDifficulty =
      difficultyFilter === "" || question.difficulty === difficultyFilter;

    return (
      matchesSearch &&
      matchesSubject &&
      matchesTopic &&
      matchesDifficulty
    );
  });
  
  const selectFilteredQuestions = () => {
    if (!exam) return;

    const filteredIds = filteredQuestions.map((q) => q.id);

    updateField(
      "questionIds",
      Array.from(new Set([...exam.questionIds, ...filteredIds]))
    );
  };

  const clearFilteredQuestions = () => {
    if (!exam) return;

    const filteredIds = new Set(filteredQuestions.map((q) => q.id));

    updateField(
      "questionIds",
      exam.questionIds.filter((id) => !filteredIds.has(id))
    );
  };
  
  const displayedQuestions = exam
  ? filteredQuestions
      .filter((question) => {
        if (viewMode === "selected") {
          return exam.questionIds.includes(question.id);
        }

        if (viewMode === "unselected") {
          return !exam.questionIds.includes(question.id);
        }

        return true;
      })
      .sort((a, b) => {
        const indexA = exam.questionIds.indexOf(a.id);
        const indexB = exam.questionIds.indexOf(b.id);

        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
      })
  : [];
 
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

      <Card className="form-card exam-form-card">
          <div className="form-grid">
            <ExamDetailsForm
              exam={exam}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onUpdateField={updateField}
            />

            <QuestionBankFilters
              search={search}
              subjectFilter={subjectFilter}
              topicFilter={topicFilter}
              difficultyFilter={difficultyFilter}
              subjects={subjects}
              topics={topics}
              onSearchChange={setSearch}
              onSubjectChange={setSubjectFilter}
              onTopicChange={setTopicFilter}
              onDifficultyChange={setDifficultyFilter}
              onSelectFiltered={selectFilteredQuestions}
              onClearFiltered={clearFilteredQuestions}
            />

            <ExamQuestionTable
              exam={exam}
              questions={displayedQuestions}
              onToggleQuestion={toggleQuestion}
              onMoveQuestion={moveQuestion}
            />

            <ExamEditActions
              saving={saving}
              onSave={saveChanges}
              onCancel={() => router.push("/admin/exams")}
            />
          </div>
      </Card>
    </main>
  );
};
