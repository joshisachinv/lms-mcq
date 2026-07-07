"use client";

import { useEffect, useMemo, useState } from "react";

import { getQuestions, Question } from "@/lib/questionService";
import { getQuestionUsageMap, getQuestionUsageDetailsMap } from "@/lib/examService";
import { getQuestionStatsMap, QuestionStats } from "@/lib/attemptService";

import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import QuestionGrid from "@/components/questions/QuestionGrid";


export default function QuestionReviewTable() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionUsageMap, setQuestionUsageMap] = useState<Record<string, number>>({});
  const [questionUsageDetailsMap, setQuestionUsageDetailsMap] = useState<Record<string, string[]>>({});
  const [questionStatsMap, setQuestionStatsMap] = useState<Record<string, QuestionStats>>({});

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [testedFilter, setTestedFilter] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [questionData, usageMap, usageDetailsMap, statsMap] = await Promise.all([
        getQuestions(),
        getQuestionUsageMap(),
        getQuestionUsageDetailsMap(),
        getQuestionStatsMap(),
      ]);
      setQuestions(questionData);
      setQuestionUsageMap(usageMap);
      setQuestionUsageDetailsMap(usageDetailsMap);
      setQuestionStatsMap(statsMap);
    } catch (error) {
      console.error(error);
      alert("Failed to load question performance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  if (loading) {
    return <p className="auth-loading">Loading question performance...</p>;
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
          statsMap={questionStatsMap}
          showReviewStats
          onQuestionUpdated={(updatedQuestion) =>
            setQuestions((current) =>
              current.map((question) =>
                question.id === updatedQuestion.id ? updatedQuestion : question
              )
            )
          }
        />
      )}
    </>
  );
}
