"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "../../create/creator.module.css";

// ── Types ───────────────────────────────────────────────────────────────────
interface AnswerDraft {
  id: string; // local uuid for key prop
  text: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  id: string; // local uuid
  text: string;
  points: number;
  answers: AnswerDraft[];
}

let _uid = 0;
const uid = () => `local-${++_uid}`;

const defaultAnswer = (): AnswerDraft => ({ id: uid(), text: "", isCorrect: false });
const defaultQuestion = (): QuestionDraft => ({
  id: uid(),
  text: "",
  points: 1,
  answers: [defaultAnswer(), defaultAnswer(), defaultAnswer(), defaultAnswer()],
});

export default function QuizEditor({ quiz }: { quiz: any }) {
  const router = useRouter();

  // ── Quiz meta state ──────────────────────────────────────────────────────
  const [title, setTitle] = useState(quiz.title || "");
  const [description, setDescription] = useState(quiz.description || "");
  const [timeLimit, setTimeLimit] = useState(quiz.timeLimit ? String(quiz.timeLimit / 60) : "");
  const [isPublished, setIsPublished] = useState(quiz.isPublished || false);

  // ── Questions state ──────────────────────────────────────────────────────
  // Map existing DB questions to local drafts
  const initialQuestions = quiz.questions && quiz.questions.length > 0 
    ? quiz.questions.map((q: any) => ({
        id: uid(),
        text: q.text,
        points: q.points,
        answers: q.answers.map((a: any) => ({
          id: uid(),
          text: a.text,
          isCorrect: a.isCorrect
        }))
      }))
    : [defaultQuestion()];

  const [questions, setQuestions] = useState<QuestionDraft[]>(initialQuestions);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Question handlers ────────────────────────────────────────────────────
  const addQuestion = useCallback(() => {
    setQuestions((prev) => [...prev, defaultQuestion()]);
  }, []);

  const removeQuestion = useCallback((qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  }, []);

  const updateQuestion = useCallback(
    (qId: string, field: keyof QuestionDraft, value: string | number) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, [field]: value } : q))
      );
    },
    []
  );

  // ── Answer handlers ──────────────────────────────────────────────────────
  const addAnswer = useCallback((qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, answers: [...q.answers, defaultAnswer()] }
          : q
      )
    );
  }, []);

  const removeAnswer = useCallback((qId: string, aId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, answers: q.answers.filter((a) => a.id !== aId) }
          : q
      )
    );
  }, []);

  const updateAnswer = useCallback(
    (qId: string, aId: string, field: keyof AnswerDraft, value: string | boolean) => {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === qId
            ? {
                ...q,
                answers: q.answers.map((a) =>
                  a.id === aId ? { ...a, [field]: value } : a
                ),
              }
            : q
        )
      );
    },
    []
  );

  const toggleCorrect = useCallback((qId: string, aId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === aId ? { ...a, isCorrect: !a.isCorrect } : a
              ),
            }
          : q
      )
    );
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!title.trim()) return "Please provide a quiz title.";
    if (questions.length === 0) return "Add at least one question.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} has no text.`;
      if (q.answers.length < 2) return `Question ${i + 1} needs at least 2 answers.`;
      const hasCorrect = q.answers.some((a) => a.isCorrect);
      if (!hasCorrect) return `Question ${i + 1} must have at least one correct answer.`;
      for (const a of q.answers) {
        if (!a.text.trim()) return `All answer fields in Question ${i + 1} must be filled.`;
      }
    }
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (publish: boolean) => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        timeLimit: timeLimit ? Number(timeLimit) * 60 : null, // convert minutes → seconds
        isPublished: publish,
        questions: questions.map((q) => ({
          text: q.text,
          points: q.points,
          answers: q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
        })),
      };

      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.creatorPage}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Dashboard
        </Link>
        <h1>Edit Quiz</h1>
        <p>Modify your quiz content, questions, and settings below.</p>
      </div>

      {/* Error */}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {/* ── Quiz Metadata Section ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Quiz Details</div>

        <div className={styles.fieldGroup}>
          <label htmlFor="quiz-title">Quiz Title *</label>
          <Input
            id="quiz-title"
            type="text"
            placeholder="e.g. JavaScript Fundamentals"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="quiz-desc">Description</label>
          <Input
            id="quiz-desc"
            type="text"
            placeholder="Short description of the quiz (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="quiz-time">Time Limit (minutes)</label>
            <Input
              id="quiz-time"
              type="number"
              placeholder="e.g. 10 (leave blank for none)"
              value={timeLimit}
              min={1}
              onChange={(e) => setTimeLimit(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <strong>Publish Immediately</strong>
            <span>Published quizzes are visible to all users</span>
          </div>
          <label className={styles.toggle} aria-label="Publish toggle">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <span className={styles.slider} />
          </label>
        </div>
      </div>

      {/* ── Questions Section ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          Questions ({questions.length})
        </div>

        {questions.map((q, qi) => (
          <div key={q.id} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNum}>Question {qi + 1}</span>
              {questions.length > 1 && (
                <button
                  className={styles.removeBtn}
                  onClick={() => removeQuestion(q.id)}
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor={`q-text-${q.id}`}>Question Text *</label>
              <Input
                id={`q-text-${q.id}`}
                type="text"
                placeholder="Enter your question here…"
                value={q.text}
                onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor={`q-pts-${q.id}`}>Points</label>
              <Input
                id={`q-pts-${q.id}`}
                type="number"
                value={q.points}
                min={1}
                max={10}
                onChange={(e) =>
                  updateQuestion(q.id, "points", Number(e.target.value))
                }
              />
            </div>

            <div className={styles.answersTitle}>
              Answers — click ✓ to mark correct
            </div>

            {q.answers.map((a, ai) => (
              <div key={a.id} className={styles.answerRow}>
                <Input
                  id={`a-text-${a.id}`}
                  type="text"
                  placeholder={`Answer ${ai + 1}`}
                  value={a.text}
                  onChange={(e) =>
                    updateAnswer(q.id, a.id, "text", e.target.value)
                  }
                />
                <button
                  type="button"
                  className={`${styles.correctToggle} ${
                    a.isCorrect ? styles.isCorrect : ""
                  }`}
                  onClick={() => toggleCorrect(q.id, a.id)}
                  title={a.isCorrect ? "Mark as incorrect" : "Mark as correct"}
                >
                  {a.isCorrect ? "✓ Correct" : "✗ Wrong"}
                </button>
                {q.answers.length > 2 && (
                  <button
                    type="button"
                    className={styles.removeAnswerBtn}
                    onClick={() => removeAnswer(q.id, a.id)}
                    title="Remove answer"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className={styles.addAnswerBtn}
              onClick={() => addAnswer(q.id)}
            >
              + Add Answer
            </button>
          </div>
        ))}

        <div className={styles.addQuestionSection}>
          <Button variant="outline" onClick={addQuestion} type="button">
            + Add Question
          </Button>
        </div>
      </div>

      {/* ── Submit Bar ── */}
      <div className={styles.submitBar}>
        <div className={styles.submitInfo}>
          <strong>{questions.length}</strong> question
          {questions.length !== 1 ? "s" : ""} ·{" "}
          <strong>{totalPoints}</strong> total point
          {totalPoints !== 1 ? "s" : ""}
        </div>
        <div className={styles.submitActions}>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            type="button"
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            type="button"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
