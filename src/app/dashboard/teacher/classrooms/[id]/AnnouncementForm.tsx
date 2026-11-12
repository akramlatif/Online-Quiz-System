"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function AnnouncementForm({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Announcement content is required.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/classrooms/${classroomId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post announcement");
      }

      setContent("");
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        + Post Announcement
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass p-6 rounded-xl border border-white/10 space-y-4 mb-8">
      <h3 className="text-xl font-bold">New Announcement</h3>

      {error && (
        <div style={{
          background: "rgba(255,82,82,0.1)",
          border: "1px solid rgba(255,82,82,0.3)",
          color: "#ff5252",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          fontSize: "0.875rem"
        }}>
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Announcement</label>
        <textarea
          className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="e.g. Quiz 2 will be published this Friday!"
          rows={3}
          maxLength={2000}
          required
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setError(""); }} disabled={isLoading} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading || !content.trim()} className="flex-1">
          {isLoading ? "Posting..." : "Post Announcement"}
        </Button>
      </div>
    </form>
  );
}