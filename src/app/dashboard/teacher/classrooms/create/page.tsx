"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CreateClassroomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        throw new Error("Failed to create classroom");
      }

      const data = await res.json();
      // Redirect to the classroom detail page so the teacher can see the share link
      router.push(`/dashboard/teacher/classrooms/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/teacher/classrooms" className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-2">
          <span>←</span> Back to Classrooms
        </Link>
      </div>

      <div className="glass p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <h1 className="text-3xl font-bold mb-2">Create New Classroom</h1>
        <p className="text-gray-400 mb-8">Setup a new virtual environment for your students.</p>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Classroom Name *</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Introduction to Computer Science"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
            <textarea
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of what this class covers..."
              disabled={isLoading}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <Link href="/dashboard/teacher/classrooms" className="flex-1">
              <Button type="button" variant="outline" fullWidth disabled={isLoading}>
                Cancel
              </Button>
            </Link>
            <div className="flex-1">
              <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Classroom"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
