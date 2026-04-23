"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// ── Types ────────────────────────────────────────────────────────────────────
interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  points: number;
  order: number;
  type: "MCQ" | "SUBJECTIVE";
  answers: Answer[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null; 
  _count: { questions: number; attempts: number };
  questions: Question[];
}

interface ResultPayload {
  score: number;
  totalPoints: number;
  percentage: number;
  tabSwitches: number;
}

type Phase = "ready" | "taking" | "submitted";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function QuizTaker({ quiz }: { quiz: Quiz }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(quiz.timeLimit ?? 0);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const totalTime = quiz.timeLimit ?? 0;
  const hasTimer = totalTime > 0;

  const handleSubmit = useCallback(
    async (answers: Record<string, string>, finalSwitches: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`/api/quizzes/${quiz.id}/attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, tabSwitches: finalSwitches }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Submission failed");
        setResult(data);
        setPhase("submitted");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [quiz.id]
  );

  // Anti-Cheating: Tab Switch Detection
  useEffect(() => {
    if (phase !== "taking") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const newCount = prev + 1;
          setWarningMessage(`Warning: You have switched tabs ${newCount} time(s). This is recorded.`);
          if (newCount >= 3) {
            handleSubmit(selectedAnswers, newCount);
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [phase, handleSubmit, selectedAnswers]);

  // Timer Logic
  useEffect(() => {
    if (phase !== "taking" || !hasTimer) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(selectedAnswers, tabSwitches);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, hasTimer, handleSubmit, selectedAnswers, tabSwitches]);

  const startQuiz = () => {
    setTimeLeft(totalTime);
    setSelectedAnswers({});
    setTabSwitches(0);
    setWarningMessage(null);
    setPhase("taking");
  };

  const selectAnswer = (questionId: string, answerValue: string) => {
    if (phase !== "taking") return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerValue }));
  };

  const answered = Object.keys(selectedAnswers).filter(k => selectedAnswers[k].trim() !== "").length;
  const total = quiz.questions.length;
  const pct = hasTimer ? (timeLeft / totalTime) * 100 : 0;
  const timerClass = pct < 20 ? "text-red-500 font-bold animate-pulse" : pct < 40 ? "text-yellow-400 font-bold" : "text-cyan-400 font-bold";

  // Result helpers
  function getAnswerClass(q: Question, a: Answer): string {
    if (phase !== "submitted") return "";
    const chosen = selectedAnswers[q.id];
    if (a.isCorrect && chosen === a.id) return "bg-green-500/20 border-green-500 text-green-300";
    if (a.isCorrect && chosen !== a.id) return "bg-green-500/10 border-green-500/50 text-green-400";
    if (!a.isCorrect && chosen === a.id) return "bg-red-500/20 border-red-500 text-red-300";
    return "border-white/10 opacity-50";
  }

  function getResultMessage(pct: number): string {
    if (pct === 100) return "🏆 Perfect score! Absolutely flawless.";
    if (pct >= 80) return "🎉 Great work! You nailed it.";
    if (pct >= 60) return "👍 Good effort! Keep practicing.";
    if (pct >= 40) return "📚 Not bad, but there's room to grow.";
    return "💪 Keep studying — you've got this!";
  }

  if (phase === "ready") {
    return (
      <div className="container mx-auto p-4 py-12 max-w-4xl text-center">
        <div className="mb-6 text-left">
          <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-2">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
        
        <div className="glass p-12 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent relative z-10">{quiz.title}</h1>
          {quiz.description && <p className="text-gray-300 text-lg mb-8 relative z-10 max-w-2xl mx-auto">{quiz.description}</p>}
          
          <div className="flex flex-wrap justify-center gap-4 mb-12 relative z-10">
            <div className="glass px-6 py-3 rounded-full border border-white/10 font-semibold">{quiz.questions.length} Questions</div>
            {hasTimer && <div className="glass px-6 py-3 rounded-full border border-white/10 font-semibold text-cyan-300">⏱ {Math.round(totalTime / 60)} Minutes</div>}
            <div className="glass px-6 py-3 rounded-full border border-white/10 font-semibold text-pink-300">{quiz._count.attempts} Attempt{quiz._count.attempts !== 1 ? "s" : ""}</div>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl mb-8 text-sm max-w-md mx-auto text-left relative z-10">
            <strong>⚠️ Anti-Cheating Enabled</strong>
            <p className="mt-1">Do not switch tabs during the quiz. Doing so 3 times will automatically submit your quiz.</p>
          </div>
          
          <Button variant="primary" size="lg" onClick={startQuiz} className="relative z-10 text-lg px-12 py-6 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-1 transition-all">
            Start Quiz →
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "submitted" && result) {
    return (
      <div className="container mx-auto p-4 py-8 max-w-4xl">
        <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-2 mb-8">
          <span>←</span> Dashboard
        </Link>
        
        <div className="glass p-8 rounded-3xl border border-white/10 text-center relative overflow-hidden mb-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-40 h-40 mx-auto rounded-full border-8 border-cyan-500 flex flex-col items-center justify-center relative z-10 mb-6 bg-black/40 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            <div className="text-4xl font-extrabold text-white">{result.percentage}%</div>
            <div className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">Score</div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2 relative z-10">Quiz Complete!</h2>
          <p className="text-gray-300 text-lg mb-8 relative z-10">{getResultMessage(result.percentage)}</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto relative z-10">
            <div className="glass p-4 rounded-xl">
              <div className="text-sm text-gray-400 uppercase">Points</div>
              <div className="text-2xl font-bold">{result.score} / {result.totalPoints}</div>
            </div>
            <div className="glass p-4 rounded-xl">
              <div className="text-sm text-gray-400 uppercase">Questions</div>
              <div className="text-2xl font-bold">{total}</div>
            </div>
            <div className="glass p-4 rounded-xl col-span-2">
              <div className="text-sm text-gray-400 uppercase">Tab Switches (Violations)</div>
              <div className={`text-2xl font-bold ${result.tabSwitches > 0 ? "text-red-400" : "text-green-400"}`}>{result.tabSwitches}</div>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Review Answers</h3>
        <div className="space-y-6">
          {quiz.questions.map((q, qi) => (
            <div key={q.id} className="glass p-6 rounded-2xl border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-cyan-300">Question {qi + 1}</span>
                <span className="text-sm font-semibold text-gray-400">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-lg mb-6">{q.text}</p>
              
              {q.type === "MCQ" ? (
                <div className="space-y-3">
                  {q.answers.map((a, ai) => (
                    <div
                      key={a.id}
                      className={`p-4 rounded-xl border flex items-center gap-4 transition-colors ${getAnswerClass(q, a)}`}
                    >
                      <span className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center font-bold text-sm shrink-0">
                        {LETTERS[ai]}
                      </span>
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-gray-500 uppercase mb-2">Your Response</div>
                  <p className="text-gray-300 italic whitespace-pre-wrap">{selectedAnswers[q.id] || "No response provided."}</p>
                  <div className="mt-4 pt-4 border-t border-white/5 text-sm text-yellow-400">
                    Subjective answers require manual grading by your instructor.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quiz Taking Screen
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 glass border-b border-white/10 px-4 py-3 flex justify-between items-center shadow-lg">
        <h1 className="font-bold truncate max-w-md">{quiz.title}</h1>
        {hasTimer && (
          <div className="glass px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <span className="text-sm uppercase tracking-wider text-gray-400 font-semibold">Time Left</span>
            <span className={`text-xl font-mono tracking-wider ${timerClass}`}>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <div className="container mx-auto p-4 py-8 max-w-3xl">
        {warningMessage && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-4 rounded-xl mb-8 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            {warningMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-12 mb-24">
          {quiz.questions.map((q, qi) => (
            <div key={q.id} className="glass p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors duration-500">
              <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500/20 group-hover:bg-cyan-500 transition-colors"></div>
              
              <div className="flex justify-between items-center mb-6 pl-4">
                <span className="font-extrabold text-gray-400 tracking-widest uppercase text-sm">Question {qi + 1} of {total}</span>
                <span className="glass px-3 py-1 rounded-lg text-xs font-bold text-cyan-300">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
              </div>
              
              <p className="text-2xl font-medium leading-relaxed mb-8 pl-4">{q.text}</p>
              
              {q.type === "MCQ" ? (
                <div className="space-y-3 pl-4">
                  {q.answers.map((a, ai) => {
                    const isSelected = selectedAnswers[q.id] === a.id;
                    return (
                      <button
                        key={a.id}
                        className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 group/btn ${
                          isSelected 
                            ? "bg-cyan-500/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                            : "bg-black/40 border-white/10 hover:border-cyan-500/50 hover:bg-white/5"
                        }`}
                        onClick={() => selectAnswer(q.id, a.id)}
                      >
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${isSelected ? "bg-cyan-500 text-white" : "bg-white/10 text-gray-400 group-hover/btn:bg-white/20"}`}>
                          {LETTERS[ai]}
                        </span>
                        <span className={`text-lg ${isSelected ? "text-white font-semibold" : "text-gray-300"}`}>{a.text}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="pl-4">
                  <textarea
                    className="w-full bg-black/40 border border-white/20 rounded-2xl p-6 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all min-h-[200px]"
                    placeholder="Type your detailed answer here..."
                    value={selectedAnswers[q.id] || ""}
                    onChange={(e) => selectAnswer(q.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 glass border-t border-white/10 z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <div className="container mx-auto max-w-3xl flex justify-between items-center">
          <div>
            <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Progress</div>
            <div className="font-bold text-xl"><span className="text-cyan-400">{answered}</span> / {total} answered</div>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="text-lg px-12 shadow-lg shadow-cyan-500/30"
            disabled={isSubmitting}
            onClick={() => handleSubmit(selectedAnswers, tabSwitches)}
          >
            {isSubmitting ? "Submitting…" : "Submit Quiz →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
