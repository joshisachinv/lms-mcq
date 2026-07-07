"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { uploadQuestionImage } from "@/lib/imageStorage";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import MathText from "@/components/math/MathText";

import {
  getQuestionById,
  updateQuestion,
  Question,
} from "@/lib/questionService";

export default function EditQuestionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [question, setQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const loadQuestion = async () => {
      try {
        const foundQuestion = await getQuestionById(id);

        setQuestion({
          ...foundQuestion,
          questionImage: foundQuestion.questionImage || "",
          optionAImage: foundQuestion.optionAImage || "",
          optionBImage: foundQuestion.optionBImage || "",
          optionCImage: foundQuestion.optionCImage || "",
          optionDImage: foundQuestion.optionDImage || "",
        });
      } catch (error) {
        console.error(error);
        alert("Failed to load question.");
      }
    };

    loadQuestion();
  }, [id]); 

  const updateField = (
    field: keyof Question,
    value: string | number | string[]
  ) => {
    if (!question) return;

    setQuestion({
      ...question,
      [field]: value,
    });
  };

  const toggleCorrectAnswer = (option: string) => {
    if (!question) return;

    if (question.questionType === "single") {
      updateField("correctAnswers", [option]);
      return;
    }

    const exists = question.correctAnswers.includes(option);

    const updatedAnswers = exists
      ? question.correctAnswers.filter((answer) => answer !== option)
      : [...question.correctAnswers, option];

    updateField("correctAnswers", updatedAnswers);
  };

  const getFile = (inputId: string) => {
    return (
      (document.getElementById(inputId) as HTMLInputElement | null)
        ?.files?.[0] ?? null
    );
  };
  const saveChanges = async () => {
    if (!question) return;

    const newQuestionImageFile = getFile("questionImage");
    const newOptionAImageFile = getFile("optionAImage");
    const newOptionBImageFile = getFile("optionBImage");
    const newOptionCImageFile = getFile("optionCImage");
    const newOptionDImageFile = getFile("optionDImage");

    const questionImage = newQuestionImageFile
      ? await uploadQuestionImage(newQuestionImageFile)
      : question.questionImage;

    const optionAImage = newOptionAImageFile
      ? await uploadQuestionImage(newOptionAImageFile)
      : question.optionAImage;

    const optionBImage = newOptionBImageFile
      ? await uploadQuestionImage(newOptionBImageFile)
      : question.optionBImage;

    const optionCImage = newOptionCImageFile
      ? await uploadQuestionImage(newOptionCImageFile)
      : question.optionCImage;

    const optionDImage = newOptionDImageFile
      ? await uploadQuestionImage(newOptionDImageFile)
      : question.optionDImage;

    const updatedQuestion: Question = {
      ...question,
      questionImage,
      optionAImage,
      optionBImage,
      optionCImage,
      optionDImage,
    };

    await updateQuestion(updatedQuestion);

    alert("Question updated.");
    router.push("/admin/questions");
  };
  

  if (!question) {
    return (
      <main className="page-container">
        <h1>Edit Question</h1>
        <p>Question not found.</p>
      </main>
    );
  }

  return (
    <main className="page-container">
      <PageTitle
        title="Edit Question"
        subtitle="Update question text, answers, timers, and images."
      />

      <Card className="form-card">
        <div className="form-grid">
          <FormSection title="Question Details">
            <div className="form-grid">
              <Input
                label="Subject"
                value={question.subject}
                onChange={(e) => updateField("subject", e.target.value)}
              />

              <Input
                label="Topic"
                value={question.topic}
                onChange={(e) => updateField("topic", e.target.value)}
              />

              <Select
                label="Difficulty"
                value={question.difficulty}
                onChange={(e) => updateField("difficulty", e.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>

              <Select
                label="Question Type"
                value={question.questionType}
                onChange={(e) => {
                  updateField("questionType", e.target.value);
                  updateField("correctAnswers", []);
                }}
              >
                <option value="single">Single Correct Answer</option>
                <option value="multiple">Multiple Correct Answers</option>
              </Select>

              <Textarea
                label="Question Text"
                rows={5}
                value={question.questionText}
                onChange={(e) => updateField("questionText", e.target.value)}
              />
            </div>
          </FormSection>

          <FormSection title="Question Image">
            {question.questionImage ? (
              <>
                <img
                  src={question.questionImage}
                  alt="Question"
                  className="image-preview"
                />

                <Button
                  type="button"
                  variant="danger"
                  onClick={() => updateField("questionImage", "")}
                >
                  Remove Question Image
                </Button>
              </>
            ) : (
              <p>No question image.</p>
            )}

            <br />

            <Input
              label="Replace Question Image"
              id="questionImage"
              type="file"
              accept="image/*"
            />
          </FormSection>

          <FormSection title="Answer Options">
            <div className="form-grid">
              {["A", "B", "C", "D"].map((option) => {
                const optionTextKey = `option${option}` as keyof Question;
                const optionImageKey = `option${option}Image` as keyof Question;
                const existingImage = String(question[optionImageKey] || "");

                return (
                  <div key={option} className="form-section">
                    <div className="form-section-title">Option {option}</div>

                    <label>
                      <input
                        type={
                          question.questionType === "single" ? "radio" : "checkbox"
                        }
                        name="correctAnswer"
                        checked={question.correctAnswers.includes(option)}
                        onChange={() => toggleCorrectAnswer(option)}
                      />{" "}
                      Correct Answer
                    </label>

                    <br />
                    <br />

                    <Input
                      value={String(question[optionTextKey] || "")}
                      onChange={(e) => updateField(optionTextKey, e.target.value)}
                    />

                    <br />

                    <div>
                      <FormSection title={`Option ${option} Image`}>

                      {existingImage ? (
                        <>
                          <img
                            src={existingImage}
                            alt={`Option ${option}`}
                            className="image-preview-sm"
                          />

                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => updateField(optionImageKey, "")}
                          >
                            Remove Option {option} Image
                          </Button>
                        </>
                      ) : (
                        <p>No image for option {option}.</p>
                      )}
                    
                      <br />

                      <Input
                        label={`Replace Option ${option} Image`}
                        id={`option${option}Image`}
                        type="file"
                        accept="image/*"
                      />
                      </FormSection>
                    </div>
                    
                  </div>
                );
              })}
            </div>
          </FormSection>

          <FormSection title="Explanation and Timer">
            <div className="form-grid">
              <Textarea
                label="Explanation"
                rows={4}
                value={question.explanation ?? ""}
                onChange={(e) => updateField("explanation", e.target.value)}
              />

              <div className="math-preview">
                <strong>Preview:</strong>{" "}
                {question.explanation ? (
                  <MathText text={question.explanation} />
                ) : (
                  "No explanation provided."
                )}
              </div>

              <Input
                label="Question Timer Seconds"
                type="number"
                value={question.timerSeconds}
                onChange={(e) =>
                  updateField("timerSeconds", Number(e.target.value))
                }
              />
            </div>
          </FormSection>

          <div className="action-row">
            <Button type="button" onClick={saveChanges}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </main>  
  );
}