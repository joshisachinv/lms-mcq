"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  archiveQuestion,
  duplicateQuestion,
  getQuestions,
  Question,
} from "@/lib/questionService";
import { getQuestionUsageMap, getQuestionUsageDetailsMap } from "@/lib/examService";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import QuestionGrid from "@/components/questions/QuestionGrid";
import { useToast } from "@/components/ui/ToastProvider";

export default function QuestionTable() {
  const toast = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionUsageMap, setQuestionUsageMap] = useState<Record<string, number>>({});
  const [questionUsageDetailsMap, setQuestionUsageDetailsMap] = useState<Record<string, string[]>>({});

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [testedFilter, setTestedFilter] = useState("");

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const [data, usageMap, usageDetailsMap] = await Promise.all([
        getQuestions(),
        getQuestionUsageMap(),
        getQuestionUsageDetailsMap(),
      ]);
      setQuestions(data);
      setQuestionUsageMap(usageMap);
      setQuestionUsageDetailsMap(usageDetailsMap);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const testedQuestionIds = useMemo(
    () => new Set(Object.keys(questionUsageMap)),
    [questionUsageMap]
  );

  const subjects = useMemo(
    () => Array.from(new Set(questions.map((q) => q.subject).filter(Boolean))),
    [questions]
  );

  const topics = useMemo(
    () => Array.from(new Set(questions.map((q) => q.topic).filter(Boolean))),
    [questions]
  );

  const types = useMemo(
    () => Array.from(new Set(questions.map((q) => q.questionType).filter(Boolean))),
    [questions]
  );

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const searchableText = [
        question.subject,
        question.topic,
        question.difficulty,
        question.questionType,
        question.questionText,
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
        question.correctAnswers?.join(", "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(search.toLowerCase());

      const matchesSubject = subjectFilter
        ? question.subject === subjectFilter
        : true;

      const matchesTopic = topicFilter ? question.topic === topicFilter : true;

      const matchesDifficulty = difficultyFilter
        ? question.difficulty === difficultyFilter
        : true;

      const matchesType = typeFilter
        ? question.questionType === typeFilter
        : true;

      const alreadyTested = testedQuestionIds.has(question.id);

      const matchesTested =
        testedFilter === "tested"
          ? alreadyTested
          : testedFilter === "not-tested"
          ? !alreadyTested
          : true;

      return (
        matchesSearch &&
        matchesSubject &&
        matchesTopic &&
        matchesDifficulty &&
        matchesType &&
        matchesTested
      );
    });
  }, [
    questions,
    search,
    subjectFilter,
    topicFilter,
    difficultyFilter,
    typeFilter,
    testedFilter,
    testedQuestionIds,
  ]);

  const handleArchive = async (id: string) => {
    const confirmed = confirm("Archive this question?");
    if (!confirmed) return;

    try {
      await archiveQuestion(id);
      await loadQuestions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to archive question.");
    }
  };

  const handleDuplicate = async (question: Question) => {
    try {
      await duplicateQuestion(question);
      await loadQuestions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to duplicate question.");
    }
  };

  if (loading) {
    return <p className="auth-loading">Loading questions...</p>;
  }

  if (questions.length === 0) {
    return <EmptyState message="No questions saved yet." />;
  }

  return (
    <>
      <div className="form-card filter-panel">
        <div className="form-grid-3">
          <div className="form-span-3">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, topic, difficulty, type, or question text"
            />
          </div>

          <Select
            label="Subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </Select>

          <Select
            label="Topic"
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
          >
            <option value="">All topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </Select>

          <Select
            label="Difficulty"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">All difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Difficult">Difficult</option>
          </Select>

          <Select
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>

          <Select
            label="Already tested"
            value={testedFilter}
            onChange={(e) => setTestedFilter(e.target.value)}
          >
            <option value="">All questions</option>
            <option value="tested">Already used in another exam</option>
            <option value="not-tested">Not yet used in any exam</option>
          </Select>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <EmptyState message="No questions match your search or filters." />
      ) : (
        <QuestionGrid
          questions={filteredQuestions}
          testedQuestionIds={testedQuestionIds}
          usageMap={questionUsageMap}
          usageDetailsMap={questionUsageDetailsMap}
          onQuestionUpdated={(updatedQuestion) =>
            setQuestions((current) =>
              current.map((question) =>
                question.id === updatedQuestion.id ? updatedQuestion : question
              )
            )
          }
          renderActions={(question) => (
            <div className="question-actions">
              <Link href={`/admin/questions/edit/${question.id}`}>
                <Button variant="icon" title="Open full edit page">
                  ✎
                </Button>
              </Link>

              <Button
                variant="icon"
                title="Duplicate"
                onClick={() => handleDuplicate(question)}
              >
                ⧉
              </Button>

              <Button
                variant="iconDanger"
                title="Archive"
                onClick={() => handleArchive(question.id)}
              >
                🗄
              </Button>
            </div>
          )}
        />
      )}
    </>
  );
}