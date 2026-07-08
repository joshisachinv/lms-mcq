"use client";

import { useState } from "react";
import { uploadQuestionImage } from "@/lib/imageStorage";
import { addQuestion } from "@/lib/questionService";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/ToastProvider";

type QuestionFormData = {
  subject: string;
  topic: string;
  difficulty: string;
  questionType: string;
  questionText: string;
  questionImage: string;
  optionA: string;
  optionAImage: string;
  optionB: string;
  optionBImage: string;
  optionC: string;
  optionCImage: string;
  optionD: string;
  optionDImage: string;
  correctAnswers: string[];
  explanation: string;
  timerSeconds: number;
  isArchived: boolean;
};

export default function QuestionForm() {
  const toast = useToast();
  const [questionType, setQuestionType] = useState("single");
  const [saving, setSaving] = useState(false);

  const saveQuestion = async () => {
    const form = document.getElementById("question-form") as HTMLFormElement;
    const data = new FormData(form);

    const correctAnswers = data.getAll("correctAnswer").map(String);

    if (!String(data.get("subject") || "").trim()) {
      toast.error("Please enter a subject.");
      return;
    }

    if (!String(data.get("questionText") || "").trim()) {
      toast.error("Please enter question text.");
      return;
    }

    if (correctAnswers.length === 0) {
      toast.error("Please select at least one correct answer.");
      return;
    }

    try {
      setSaving(true);

      const questionImage = await uploadQuestionImage(
        data.get("questionImage") as File | null
      );

      const optionAImage = await uploadQuestionImage(
        data.get("optionAImage") as File | null
      );

      const optionBImage = await uploadQuestionImage(
        data.get("optionBImage") as File | null
      );

      const optionCImage = await uploadQuestionImage(
        data.get("optionCImage") as File | null
      );

      const optionDImage = await uploadQuestionImage(
        data.get("optionDImage") as File | null
      );

      const question: QuestionFormData = {
        subject: String(data.get("subject") || ""),
        topic: String(data.get("topic") || ""),
        difficulty: String(data.get("difficulty") || "Easy"),
        questionType,
        questionText: String(data.get("questionText") || ""),
        questionImage,
        optionA: String(data.get("optionA") || ""),
        optionAImage,
        optionB: String(data.get("optionB") || ""),
        optionBImage,
        optionC: String(data.get("optionC") || ""),
        optionCImage,
        optionD: String(data.get("optionD") || ""),
        optionDImage,
        correctAnswers,
        explanation: String(data.get("explanation") || ""),
        timerSeconds: Number(data.get("timerSeconds") || 60),
        isArchived: false,
      };

      await addQuestion(question);

      toast.success("Question saved.");
      form.reset();
      setQuestionType("single");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id="question-form">
      <PageTitle
        title="Add Question"
        subtitle="Create a new question for the question bank."
      />

      <Card className="form-card">
        <div className="form-grid">
          <FormSection title="Question Details">
            <div className="form-grid">
              <Input label="Subject" name="subject" type="text" />

              <Input label="Topic" name="topic" type="text" />

              <Select label="Difficulty" name="difficulty">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>

              <Select
                label="Question Type"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
              >
                <option value="single">Single Correct Answer</option>
                <option value="multiple">Multiple Correct Answers</option>
              </Select>

              <Textarea label="Question Text" name="questionText" rows={5} />

              <Input
                label="Question Image"
                name="questionImage"
                type="file"
                accept="image/*"
              />
            </div>
          </FormSection>

          <FormSection title="Answer Options">
            <div className="form-grid">
              {["A", "B", "C", "D"].map((option) => (
                <div key={option} className="form-section">
                  <div className="form-section-title">Option {option}</div>

                  <label>
                    <input
                      type={questionType === "single" ? "radio" : "checkbox"}
                      name="correctAnswer"
                      value={option}
                    />{" "}
                    Correct Answer
                  </label>

                  <br />
                  <br />

                  <Input
                    name={`option${option}`}
                    type="text"
                    placeholder={`Option ${option} text`}
                  />

                  <br />

                  <Input
                    label={`Option ${option} Image`}
                    name={`option${option}Image`}
                    type="file"
                    accept="image/*"
                  />
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection title="Explanation and Timer">
            <div className="form-grid">
              <Textarea label="Explanation" name="explanation" rows={4} />

              <Input
                label="Question Timer Seconds"
                name="timerSeconds"
                type="number"
                defaultValue={60}
              />
            </div>
          </FormSection>

          <div className="action-row">
            <Button type="button" onClick={saveQuestion} disabled={saving}>
              {saving ? "Saving..." : "Save Question"}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}