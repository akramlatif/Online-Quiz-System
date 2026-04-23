"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";

export function DeleteQuizButton({ quizId }: { quizId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete quiz");
      }

      router.refresh(); // Refresh the page to show updated list
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      alert(error instanceof Error ? error.message : "Failed to delete quiz");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button variant="danger" size="sm" onClick={handleDelete} disabled={isDeleting} style={{ backgroundColor: "var(--error)", color: "white", borderColor: "var(--error)" }}>
      {isDeleting ? "..." : "Delete"}
    </Button>
  );
}
