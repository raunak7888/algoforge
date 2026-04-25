"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

const LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "cpp",
  "go",
  "rust",
];

type AnalysisResponse = any;

type Props = {
  onResult: (data: AnalysisResponse) => void;
  onError: (msg: string) => void;
};

export default function AnalysisForm({ onResult, onError }: Props) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!code.trim()) {
      onError("Code cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          onError("Your session expired. Please sign in again.");
          return;
        }

        onError(data.error ?? "Analysis failed.");
        return;
      }

      onResult(data as AnalysisResponse);
    } catch (err) {
      console.error(err);
      onError("Failed to reach the API. Is backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-300">
          Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d2d4e] text-white focus:outline-none"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-300">
          Code
        </label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Paste your code here..."
          className="w-full h-64 px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d2d4e] text-sm font-mono text-gray-200 focus:outline-none resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="w-full px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold transition"
      >
        {loading ? "Analyzing..." : "Analyze Code"}
      </button>
    </form>
  );
}
