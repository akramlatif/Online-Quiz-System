"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AddMaterialForm({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("file", file);

      const res = await fetch(`/api/classrooms/${classroomId}/materials`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload material");
      }

      setTitle("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        + Add Material
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass p-6 rounded-xl border border-white/10 space-y-4 mb-8">
      <h3 className="text-xl font-bold mb-4">Add New Material</h3>

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
      
      <Input
        label="Material Title *"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Week 1 Lecture Slides"
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          rows={3}
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Upload File *</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed rgba(102, 252, 241, 0.3)",
            borderRadius: "12px",
            padding: "1.5rem",
            textAlign: "center",
            cursor: "pointer",
            background: file ? "rgba(102, 252, 241, 0.05)" : "rgba(0,0,0,0.2)",
            transition: "all 0.2s ease",
          }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) setFile(droppedFile);
          }}
        >
          {file ? (
            <div>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📄</div>
              <p style={{ color: "#66fcf1", fontWeight: 600 }}>{file.name}</p>
              <p style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{
                  marginTop: "0.5rem",
                  color: "#ff5252",
                  fontSize: "0.75rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
              <p style={{ color: "#c5c6c7", fontWeight: 500 }}>
                Click to choose a file or drag & drop
              </p>
              <p style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                PDF, PPTX, DOCX, images, or any file type
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.txt,.jpg,.jpeg,.png,.gif,.mp4,.zip"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) setFile(selected);
            }}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setError(""); }} disabled={isLoading} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading || !file} className="flex-1">
          {isLoading ? "Uploading..." : "Save Material"}
        </Button>
      </div>
    </form>
  );
}
