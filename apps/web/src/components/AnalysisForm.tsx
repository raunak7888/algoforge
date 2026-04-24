"use client";

import { useState } from "react";
import type { AnalysisResponse } from "@/app/page";

const LANGUAGES = ["python", "javascript", "typescript", "java", "cpp", "go", "rust"];
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Props = {
  onResult: (data: AnalysisResponse) => void;
  onError: (msg: string) => void;
};

export function AnalysisForm({ onResult, onError }: Props) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!code.trim()) {
      onError("Code cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError(data.error ?? "Unknown server error.");
        return;
      }

      onResult(data as AnalysisResponse);
    } catch (err) {
      console.error(err);
      onError("Failed to reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "#1a1a2e",
    border: "1px solid #2d2d4e",
    borderRadius: 8,
    color: "#e0e0e0",
    fontSize: 14,
    padding: "10px 14px",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="// Paste your code here..."
        rows={14}
        style={{
          ...inputStyle,
          resize: "vertical",
          fontFamily: "'Courier New', monospace",
          lineHeight: 1.6,
        }}
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer", flex: "0 0 auto" }}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: loading ? "#4c1d95" : "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 28px",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Analyzing..." : "Analyze →"}
        </button>
      </div>
    </div>
  );
}
