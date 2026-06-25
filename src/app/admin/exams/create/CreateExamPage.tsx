"use client";

import { useEffect, useState } from "react";
import { getQuestions, Question } from "@/lib/questionService";
import { addExam } from "@/lib/examService";
import MathText from "@/components/math/MathText";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";

export default function CreateExamPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [overallTimerSeconds, setOverallTimerSeconds] = useState(1800);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");

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
      ${question.questionText} />
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

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    );
  };

  const selectFilteredQuestions = () => {
    const filteredIds = filteredQuestions.map((question) => question.id);

    setSelectedQuestions((current) =>
      Array.from(new Set([...current, ...filteredIds]))
    );
  };

  const clearFilteredQuestions = () => {
    const filteredIds = new Set(filteredQuestions.map((question) => question.id));

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
        questionIds: selectedQuestions,
        randomizeQuestions,
      });

      alert("Exam created.");
      setTitle("");
      setDescription("");
      setOverallTimerSeconds(1800);
      setSelectedQuestions([]);
      setSearch("");
      setSubjectFilter("");
      setTopicFilter("");
      setDifficultyFilter("");
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

      <Card className="form-card">
        <div className="form-grid">
          <FormSection title="Exam Details">
            <div className="form-grid">
              <Input
                label="Exam Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Input
                label="Overall Timer (seconds)"
                type="number"
                value={overallTimerSeconds}
                onChange={(e) =>
                  setOverallTimerSeconds(Number(e.target.value))
                }
              />

              <Select
                label="Randomize Questions"
                value={randomizeQuestions ? "yes" : "no"}
                onChange={(e) => setRandomizeQuestions(e.target.value === "yes")}
              >
                <option value="no">No - Use selected order</option>
                <option value="yes">Yes - Randomize for student</option>
              </Select>
            </div>
          </FormSection>

          <FormSection title="Filter Question Bank">
            <div className="form-grid">
              <Input
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, topic, difficulty, or question text"
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

              <Select
                label="Difficulty"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="">All difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>

              <div className="action-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={selectFilteredQuestions}
                >
                  Select Filtered
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearFilteredQuestions}
                >
                  Clear Filtered
                </Button>
              </div>
            </div>
          </FormSection>

          <FormSection
            title={`Select Questions (${selectedQuestions.length} selected)`}
          >
            {filteredQuestions.length === 0 ? (
              <EmptyState message="No questions match your filters." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>Difficulty</th>
                    <th>Question</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQuestions.map((question) => (
                    <tr key={question.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => toggleQuestion(question.id)}
                        />
                      </td>

                      <td>{question.subject}</td>
                      <td>{question.topic}</td>
                      <td>{question.difficulty}</td>
                      <td><MathText text={question.questionText} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </FormSection>

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