"use client";


import CreateExamDetailsForm from "@/components/exams/create/CreateExamDetailsForm"
import { useEffect, useState } from "react";
import QuestionBankFilters from "@/components/exams/edit/QuestionBankFilters";
import ExamQuestionSelector from "@/components/exams/edit/ExamQuestionSelector";
import { addExam } from "@/lib/examService";
import { getQuestions, Question } from "@/lib/questionService";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageTitle from "@/components/ui/PageTitle";

export default function CreateExamPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [overallTimerSeconds, setOverallTimerSeconds] = useState(1800);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [isTimed, setIsTimed] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [viewMode, setViewMode] = useState("all");

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await getQuestions();
        setQuestions(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load questions.");
      }
    };

    loadQuestions();
  }, []);

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

    const matchesSubject = subjectFilter
      ? question.subject === subjectFilter
      : true;

    const matchesTopic = topicFilter ? question.topic === topicFilter : true;

    const matchesDifficulty = difficultyFilter
      ? question.difficulty === difficultyFilter
      : true;

    return matchesSearch && matchesSubject && matchesTopic && matchesDifficulty;
  });

  const displayedQuestions = filteredQuestions
    .filter((question) => {
      if (viewMode === "selected") {
        return selectedQuestions.includes(question.id);
      }

      if (viewMode === "unselected") {
        return !selectedQuestions.includes(question.id);
      }

      return true;
    })
    .sort((a, b) => {
      const indexA = selectedQuestions.indexOf(a.id);
      const indexB = selectedQuestions.indexOf(b.id);

      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    );
  };

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    const currentIndex = selectedQuestions.indexOf(questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= selectedQuestions.length) return;

    const updatedQuestionIds = [...selectedQuestions];
    const [movedQuestion] = updatedQuestionIds.splice(currentIndex, 1);
    updatedQuestionIds.splice(newIndex, 0, movedQuestion);

    setSelectedQuestions(updatedQuestionIds);
  };

  const selectFilteredQuestions = () => {
    const filteredIds = filteredQuestions.map((question) => question.id);

    setSelectedQuestions((current) =>
      Array.from(new Set([...current, ...filteredIds]))
    );
  };

  const clearFilteredQuestions = () => {
    const filteredIds = new Set(
      filteredQuestions.map((question) => question.id)
    );

    setSelectedQuestions((current) =>
      current.filter((id) => !filteredIds.has(id))
    );
  };

  const createExam = async () => {
    if (!title.trim()) {
      alert("Please enter an exam title.");
      return;
    }

    if (selectedQuestions.length === 0) {
      alert("Please select at least one question.");
      return;
    }

    try {
      await addExam({
        title,
        description,
        overallTimerSeconds,
        isActive: false,
        isArchived: false,
        isTimed,
        randomizeQuestions,
        questionIds: selectedQuestions,
      });

      alert("Exam created.");

      setTitle("");
      setDescription("");
      setOverallTimerSeconds(1800);
      setRandomizeQuestions(false);
      setIsTimed(true);
      setSelectedQuestions([]);
      setSearch("");
      setSubjectFilter("");
      setTopicFilter("");
      setDifficultyFilter("");
      setViewMode("all");
    } catch (error) {
      console.error(error);
      alert("Failed to create exam.");
    }
  };

  return (
    <main className="page-container">
      <PageTitle
        title="Create Exam"
        subtitle="Create an exam by selecting questions from the question bank."
      />

      <Card className="form-card exam-form-card">
        <div className="form-grid">
          <CreateExamDetailsForm
            title={title}
            description={description}
            overallTimerSeconds={overallTimerSeconds}
            randomizeQuestions={randomizeQuestions}
            isTimed={isTimed}
            viewMode={viewMode}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onOverallTimerChange={setOverallTimerSeconds}
            onRandomizeQuestionsChange={setRandomizeQuestions}
            onIsTimedChange={setIsTimed}
            onViewModeChange={setViewMode}
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

          <ExamQuestionSelector
            questions={displayedQuestions}
            selectedQuestionIds={selectedQuestions}
            onToggleQuestion={toggleQuestion}
            onMoveQuestion={moveQuestion}
          />

          <div className="action-row">
            <Button type="button" onClick={createExam}>
              Create Exam
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}