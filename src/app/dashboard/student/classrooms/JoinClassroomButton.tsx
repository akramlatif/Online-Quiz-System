"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function JoinClassroomButton({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/join`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to join:", err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Button variant="outline" size="sm" fullWidth onClick={handleJoin} disabled={isJoining}>
      {isJoining ? "Joining..." : "Join"}
    </Button>
  );
}
