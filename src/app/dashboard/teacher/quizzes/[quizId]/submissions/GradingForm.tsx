"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface AttemptAnswer {
  id: string;
  questionId: string;
  textResponse: string | null;
  score: number | null;
  question: { text: string; points: number; type: string };
}

export default function GradingForm({ attemptId, attemptAnswers, initialTotalScore }: { attemptId: string; attemptAnswers: AttemptAnswer[], initialTotalScore: number }) {
  const router = useRouter();
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const subjectiveAnswers = attemptAnswers.filter(a => a.question.type === "SUBJECTIVE");

  const handleScoreChange = (id: string, val: string) => {
    setGrades(prev => ({ ...prev, [id]: Number(val) }));
    setSaved(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades }),
      });
      if (!res.ok) throw new Error("Failed to save grades");
      setSaved(true);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (subjectiveAnswers.length === 0) {
    return <div className="text-gray-400 italic">No subjective questions to grade.</div>;
  }

  return (
    <div className="space-y-6">
      {subjectiveAnswers.map((ans) => (
        <div key={ans.id} className="glass p-6 rounded-2xl border border-white/10">
          <div className="flex justify-between mb-4">
            <h4 className="font-bold text-white text-lg">{ans.question.text}</h4>
            <span className="text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">Max: {ans.question.points} pts</span>
          </div>
          
          <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-4">
            <p className="text-gray-300 whitespace-pre-wrap">{ans.textResponse || "No response provided."}</p>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-400">Awarded Points:</label>
            <input
              type="number"
              min="0"
              max={ans.question.points}
              className="bg-black/40 border border-white/20 rounded-lg px-4 py-2 w-24 text-white focus:outline-none focus:border-cyan-400"
              value={grades[ans.id] ?? ans.score ?? 0}
              onChange={(e) => handleScoreChange(ans.id, e.target.value)}
            />
          </div>
        </div>
      ))}
      
      <div className="flex items-center gap-4">
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Grades"}
        </Button>
        {saved && <span className="text-green-400 text-sm font-semibold">✓ Grades saved successfully</span>}
      </div>
    </div>
  );
}
