"use client";

import { useState, useEffect } from "react";

export default function ShareClassroomLink({ classroomId }: { classroomId: string }) {
  const [copied, setCopied] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/dashboard/student/classrooms?join=${classroomId}`);
  }, [classroomId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = joinUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{
      background: "rgba(102, 252, 241, 0.05)",
      border: "1px solid rgba(102, 252, 241, 0.2)",
      borderRadius: "16px",
      padding: "1.25rem 1.5rem",
      marginBottom: "2rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      flexWrap: "wrap",
    }}>
      <div style={{ flex: "0 0 auto", fontSize: "1.5rem" }}>🔗</div>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{ fontWeight: 700, color: "#ffffff", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
          Share with Students
        </div>
        <div style={{
          fontSize: "0.75rem",
          color: "#66fcf1",
          background: "rgba(0,0,0,0.3)",
          padding: "0.5rem 0.75rem",
          borderRadius: "8px",
          fontFamily: "monospace",
          wordBreak: "break-all",
          userSelect: "all",
        }}>
          {joinUrl}
        </div>
      </div>
      <button
        onClick={handleCopy}
        style={{
          padding: "0.625rem 1.25rem",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.875rem",
          transition: "all 0.2s ease",
          background: copied ? "rgba(76, 175, 80, 0.3)" : "rgba(102, 252, 241, 0.15)",
          color: copied ? "#4caf50" : "#66fcf1",
          flexShrink: 0,
        }}
      >
        {copied ? "✓ Copied!" : "📋 Copy Link"}
      </button>
    </div>
  );
}
