"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  archiveQuestion,
  duplicateQuestion,
  getQuestions,
  Question,
} from "@/lib/questionService";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Table from "@/components/ui/Table";
import DataTable from "@/components/datatable/DataTable";
import MathText from "../math/MathText";

export default function QuestionTable() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await getQuestions();
      setQuestions(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const subjects = Array.from(
    new Set(questions.map((q) => q.subject).filter(Boolean))
  );

  const topics = Array.from(
    new Set(questions.map((q) => q.topic).filter(Boolean))
  );

  const filteredQuestions = questions.filter((question) => {
    const searchableText = `
      ${question.subject}
      ${question.topic}
      ${question.difficulty}
      ${question.questionType}
      ${ question.questionText } />
    `.toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());

    const matchesSubject = subjectFilter
      ? question.subject === subjectFilter
      : true;

    const matchesTopic = topicFilter
      ? question.topic === topicFilter
      : true;

    return matchesSearch && matchesSubject && matchesTopic;
  });

  const handleArchive = async (id: string) => {
    const confirmed = confirm("Archive this question?");
    if (!confirmed) return;

    try {
      await archiveQuestion(id);
      await loadQuestions();
    } catch (error) {
      console.error(error);
      alert("Failed to archive question.");
    }
  };

  const handleDuplicate = async (question: Question) => {
    try {
      await duplicateQuestion(question);
      await loadQuestions();
    } catch (error) {
      console.error(error);
      alert("Failed to duplicate question.");
    }
  };

  if (loading) {
    return <p>Loading questions...</p>;
  }

  if (questions.length === 0) {
    return <EmptyState message="No questions saved yet." />;
  }

  return (
    <>
      <div className="form-card" style={{ marginBottom: "16px" }}>
        <div className="form-grid">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, topic, difficulty, type, or question text"
          />

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
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <EmptyState message="No questions match your search or filters." />
      ) : (
        <DataTable
  data={filteredQuestions}
  getRowKey={(question) => question.id}
  columns={[
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
      key: "questionType",
      label: "Type",
      filter: true,
      sortable: true,
    },
    {
      key: "questionText",
      label: "Question",
      sortable: true,
    },
    {
      key: "correctAnswers",
      label: "Correct",
      getValue: (question) => question.correctAnswers.join(", "),
    },
    {
      key: "timerSeconds",
      label: "Timer",
      getValue: (question) => `${question.timerSeconds}s`,
      sortable: true,
    },
    {
      key: "questionImage",
      label: "Image",
      filter: true,
      getValue: (question) => (question.questionImage ? "Image" : "None"),
      render: (question) => (
        <Badge color={question.questionImage ? "green" : "gray"}>
          {question.questionImage ? "Image" : "None"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (question) => (
        <div className="action-row">
          <Link href={`/admin/questions/edit/${question.id}`}>
            <Button type="button" variant="secondary">
              Edit
            </Button>
          </Link>

          <Button
            type="button"
            variant="secondary"
            onClick={() => handleDuplicate(question)}
          >
            Duplicate
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={() => handleArchive(question.id)}
          >
            Archive
          </Button>
        </div>
      ),
    },
  ]}
/>
      )}
    </>
  );
}