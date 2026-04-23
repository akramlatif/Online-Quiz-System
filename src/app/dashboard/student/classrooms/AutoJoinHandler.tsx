"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AutoJoinHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinId = searchParams.get("join");
  const [status, setStatus] = useState<"idle" | "joining" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!joinId) return;

    setStatus("joining");
    setMessage("Joining classroom...");

    fetch(`/api/classrooms/${joinId}/join`, { method: "POST" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Successfully joined the classroom!");
          // Remove the ?join= param from URL and refresh
          setTimeout(() => {
            router.replace("/dashboard/student/classrooms");
            router.refresh();
          }, 1500);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to join classroom");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [joinId, router]);

  if (!joinId) return null;

  const bgColor = status === "success"
    ? "rgba(76, 175, 80, 0.1)"
    : status === "error"
    ? "rgba(255, 82, 82, 0.1)"
    : "rgba(102, 252, 241, 0.1)";

  const borderColor = status === "success"
    ? "rgba(76, 175, 80, 0.3)"
    : status === "error"
    ? "rgba(255, 82, 82, 0.3)"
    : "rgba(102, 252, 241, 0.3)";

  const textColor = status === "success"
    ? "#4caf50"
    : status === "error"
    ? "#ff5252"
    : "#66fcf1";

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      color: textColor,
      borderRadius: "12px",
      padding: "1rem 1.5rem",
      marginBottom: "1.5rem",
      fontWeight: 600,
      fontSize: "0.875rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    }}>
      {status === "joining" && <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>}
      {status === "success" && <span>✅</span>}
      {status === "error" && <span>❌</span>}
      {message}
    </div>
  );
}
