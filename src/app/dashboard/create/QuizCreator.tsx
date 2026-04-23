"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ── Types ───────────────────────────────────────────────────────────────────
interface AnswerDraft {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  id: string;
  text: string;
  points: number;
  type: "MCQ" | "SUBJECTIVE";
  answers: AnswerDraft[];
}

let _uid = 0;
const uid = () => `local-${++_uid}`;

const defaultAnswer = (): AnswerDraft => ({ id: uid(), text: "", isCorrect: false });
const defaultQuestion = (): QuestionDraft => ({
  id: uid(),
  text: "",
  points: 1,
  type: "MCQ",
  answers: [defaultAnswer(), defaultAnswer(), defaultAnswer(), defaultAnswer()],
});

export default function QuizCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classroomId = searchParams.get("classroomId");

  // ── Quiz meta state ──────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [isPublished, setIsPublished] = useState(false);

  // ── Questions state ──────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<QuestionDraft[]>([defaultQuestion()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── AI Generation State ──────────────────────────────────────────────────
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"topic" | "document">("topic");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Topic state
  const [aiDepartment, setAiDepartment] = useState("");
  const [aiSubject, setAiSubject] = useState("");
  const [aiCustomTopic, setAiCustomTopic] = useState("");
  
  // Document state
  const [aiFile, setAiFile] = useState<File | null>(null);
  
  // Shared state
  const [aiDifficulty, setAiDifficulty] = useState("INTERMEDIATE");
  const [aiCount, setAiCount] = useState("5");

  // ── Handlers ─────────────────────────────────────────────────────────────
  const addQuestion = useCallback(() => {
    setQuestions((prev) => [...prev, defaultQuestion()]);
  }, []);

  const removeQuestion = useCallback((qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  }, []);

  const updateQuestion = useCallback((qId: string, field: keyof QuestionDraft, value: string | number) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, [field]: value } : q)));
  }, []);

  const addAnswer = useCallback((qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, answers: [...q.answers, defaultAnswer()] } : q))
    );
  }, []);

  const removeAnswer = useCallback((qId: string, aId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, answers: q.answers.filter((a) => a.id !== aId) } : q))
    );
  }, []);

  const updateAnswer = useCallback((qId: string, aId: string, field: keyof AnswerDraft, value: string | boolean) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, answers: q.answers.map((a) => (a.id === aId ? { ...a, [field]: value } : a)) }
          : q
      )
    );
  }, []);

  const toggleCorrect = useCallback((qId: string, aId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              answers: q.answers.map((a) => (a.id === aId ? { ...a, isCorrect: !a.isCorrect } : a)),
            }
          : q
      )
    );
  }, []);

  // ── AI Generator Handler ──────────────────────────────────────────────────
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("mode", aiMode);
      formData.append("difficulty", aiDifficulty);
      formData.append("questionCount", aiCount);

      if (aiMode === "topic") {
        if (!aiCustomTopic) throw new Error("Topic is required.");
        formData.append("department", aiDepartment);
        formData.append("subject", aiSubject);
        formData.append("customTopic", aiCustomTopic);
      } else {
        if (!aiFile) throw new Error("Please select a file.");
        formData.append("file", aiFile);
      }

      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        body: formData,
      });

      // Guard against empty response body (server crash / timeout)
      const text = await res.text();
      if (!text) {
        throw new Error("AI service returned an empty response. Please try again.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("AI returned an invalid response. Please try again.");
      }

      if (!res.ok) throw new Error(data.error || "Generation failed");

      // Append generated questions
      const generatedQuestions = data.questions.map((q: any) => ({
        id: uid(),
        text: q.text,
        points: q.points || 1,
        type: q.type || "MCQ",
        answers: q.answers ? q.answers.map((a: any) => ({
          id: uid(),
          text: a.text,
          isCorrect: a.isCorrect
        })) : []
      }));

      // If we only had the default empty question, replace it. Otherwise append.
      if (questions.length === 1 && questions[0].text === "") {
        setQuestions(generatedQuestions);
      } else {
        setQuestions(prev => [...prev, ...generatedQuestions]);
      }

      setIsAiModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong generating the quiz.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!title.trim()) return "Please provide a quiz title.";
    if (questions.length === 0) return "Add at least one question.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} has no text.`;
      
      if (q.type === "MCQ") {
        if (q.answers.length < 2) return `Question ${i + 1} needs at least 2 answers.`;
        const hasCorrect = q.answers.some((a) => a.isCorrect);
        if (!hasCorrect) return `Question ${i + 1} must have at least one correct answer.`;
        for (const a of q.answers) {
          if (!a.text.trim()) return `All answer fields in Question ${i + 1} must be filled.`;
        }
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
        timeLimit: timeLimit ? Number(timeLimit) * 60 : null,
        startTime: startTime ? startTime : null,
        endTime: endTime ? endTime : null,
        difficulty,
        isPublished: publish,
        classroomId: classroomId,
        questions: questions.map((q) => ({
          text: q.text,
          points: q.points,
          type: q.type,
          answers: q.type === "MCQ" ? q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })) : [],
        })),
      };

      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (classroomId) {
        router.push(`/dashboard/teacher/classrooms/${classroomId}`);
      } else {
        router.push("/dashboard/teacher");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="container mx-auto p-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href={classroomId ? `/dashboard/teacher/classrooms/${classroomId}` : "/dashboard/teacher"} className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-2">
          <span>←</span> Back
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Create a New Quiz</h1>
        <p className="text-gray-300">Build your quiz below. Add MCQ or Subjective questions, set schedules, and publish.</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>}

      <div className="glass p-8 rounded-2xl border border-white/10 mb-8 space-y-6">
        <h2 className="text-2xl font-bold border-b border-white/10 pb-4">Quiz Details</h2>

        <div className="space-y-4">
          <Input label="Quiz Title *" type="text" placeholder="e.g. Midterm Exam" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Description" type="text" placeholder="Short description of the quiz" value={description} onChange={(e) => setDescription(e.target.value)} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Time Limit (minutes)" type="number" placeholder="Leave blank for none" value={timeLimit} min={1} onChange={(e) => setTimeLimit(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <select className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Start Time (Optional)" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input label="End Time (Optional)" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>

          <div className="flex items-center gap-4 mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex-grow">
              <strong className="block text-white">Publish Immediately</strong>
              <span className="text-sm text-gray-400 block">Published quizzes are visible to students in the classroom</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-6 mb-24">
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold">Questions ({questions.length})</h2>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => setIsAiModalOpen(true)} type="button" className="bg-purple-600 hover:bg-purple-500 border-none">
              ✨ Generate with AI
            </Button>
            <Button variant="outline" size="sm" onClick={addQuestion} type="button">+ Add Question</Button>
          </div>
        </div>

        {questions.map((q, qi) => (
          <div key={q.id} className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-cyan-300">Question {qi + 1}</span>
              {questions.length > 1 && (
                <button className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors" onClick={() => removeQuestion(q.id)} type="button">Remove</button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Input label="Question Text *" type="text" placeholder="Enter your question here…" value={q.text} onChange={(e) => updateQuestion(q.id, "text", e.target.value)} />
              </div>
              <div>
                <Input label="Points" type="number" placeholder="Points" value={q.points} min={1} max={100} onChange={(e) => updateQuestion(q.id, "points", Number(e.target.value))} />
              </div>
            </div>

            <div className="flex gap-4 mb-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="radio" name={`type-${q.id}`} value="MCQ" checked={q.type === "MCQ"} onChange={() => updateQuestion(q.id, "type", "MCQ")} className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 bg-black/40 border-white/20" />
                Multiple Choice
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="radio" name={`type-${q.id}`} value="SUBJECTIVE" checked={q.type === "SUBJECTIVE"} onChange={() => updateQuestion(q.id, "type", "SUBJECTIVE")} className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 bg-black/40 border-white/20" />
                Subjective / Descriptive
              </label>
            </div>

            {q.type === "MCQ" ? (
              <div className="space-y-3 mt-4 p-4 bg-black/20 rounded-xl border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Answers — check the circle to mark correct</div>
                {q.answers.map((a, ai) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <button type="button" onClick={() => toggleCorrect(q.id, a.id)} className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0 ${a.isCorrect ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500 hover:border-gray-400'}`}>
                      {a.isCorrect && <span className="text-white text-xs">✓</span>}
                    </button>
                    <div className="flex-grow">
                      <Input type="text" placeholder={`Answer ${ai + 1}`} value={a.text} onChange={(e) => updateAnswer(q.id, a.id, "text", e.target.value)} />
                    </div>
                    {q.answers.length > 2 && (
                      <button type="button" className="text-gray-500 hover:text-red-400 px-2 text-xl font-bold" onClick={() => removeAnswer(q.id, a.id)}>×</button>
                    )}
                  </div>
                ))}
                <button type="button" className="text-sm text-cyan-400 hover:underline mt-2 inline-block font-semibold" onClick={() => addAnswer(q.id)}>+ Add another answer</button>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5">
                <p className="text-sm text-gray-400">Students will see a large text area to write their response.</p>
              </div>
            )}
          </div>
        ))}

        <div className="text-center pt-4">
          <Button variant="outline" size="lg" onClick={addQuestion} type="button">+ Add Question</Button>
        </div>
      </div>

      {/* ── AI Generation Modal ── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl border border-white/20 w-full max-w-2xl shadow-[0_0_50px_rgba(147,51,234,0.3)] relative">
            <button className="absolute top-6 right-6 text-gray-400 hover:text-white" onClick={() => setIsAiModalOpen(false)}>✕</button>
            
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              ✨ AI Quiz Generator
            </h2>
            <p className="text-gray-400 mb-6">Automatically generate questions using Google Gemini.</p>

            <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
              <button 
                type="button"
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${aiMode === "topic" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
                onClick={() => setAiMode("topic")}
              >
                By Topic
              </button>
              <button 
                type="button"
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${aiMode === "document" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
                onClick={() => setAiMode("document")}
              >
                From Document
              </button>
            </div>

            <form onSubmit={handleAiGenerate} className="space-y-4">
              {aiMode === "topic" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Department (Optional)" type="text" placeholder="e.g. Computer Science" value={aiDepartment} onChange={(e) => setAiDepartment(e.target.value)} />
                    <Input label="Subject (Optional)" type="text" placeholder="e.g. Algorithms" value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Topic or Instructions *</label>
                    <textarea 
                      required
                      className="w-full bg-black/40 border border-white/20 rounded-lg p-4 text-white focus:outline-none focus:border-purple-500 h-24"
                      placeholder="e.g. Generate a quiz about Big O notation, focusing on time complexity of sorting algorithms."
                      value={aiCustomTopic}
                      onChange={(e) => setAiCustomTopic(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Upload Slides / Document (PDF, PPTX) *</label>
                    <input 
                      type="file" 
                      required
                      accept=".pdf,.pptx,.txt,.docx"
                      className="w-full text-gray-400 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer bg-black/40 border border-white/20 rounded-lg p-2"
                      onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Difficulty</label>
                  <select className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
                <Input label="Number of Questions" type="number" min={1} max={20} value={aiCount} onChange={(e) => setAiCount(e.target.value)} />
              </div>

              <div className="pt-6">
                <Button variant="primary" fullWidth size="lg" disabled={isGenerating} className="bg-purple-600 hover:bg-purple-500 border-none">
                  {isGenerating ? "Generating..." : "Generate Questions"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Submit Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-white/10 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex justify-between items-center px-8 sm:px-16 rounded-t-2xl">
        <div className="text-sm text-gray-300">
          <span className="font-bold text-white">{questions.length}</span> questions • <span className="font-bold text-white">{totalPoints}</span> points total
        </div>
        <div className="flex gap-4">
          <Button variant="outline" disabled={isSubmitting} onClick={() => handleSubmit(false)} type="button">
            Save as Draft
          </Button>
          <Button variant="primary" disabled={isSubmitting} onClick={() => handleSubmit(true)} type="button">
            {isSubmitting ? "Publishing…" : "Publish Quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
