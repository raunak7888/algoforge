"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { AnalysisLanguage, AnalysisRecord } from "@algoforge/analysis";
import { AnalysisApiError, createAnalysis } from "@/lib/analyses";

const LANGUAGES: { value: AnalysisLanguage; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
];

type Props = {
  onResult: (data: AnalysisRecord) => void;
  onError: (msg: string) => void;
};

export default function AnalysisForm({ onResult, onError }: Props) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<AnalysisLanguage>("javascript");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!code.trim()) {
      onError("Code cannot be empty.");
      return;
    }

    setLoading(true);
    onError("");

    try {
      const analysis = await createAnalysis({
        code: code.trim(),
        language,
      });

      onResult(analysis);
    } catch (err) {
      if (err instanceof AnalysisApiError && err.status === 401) {
        onError("Your session expired. Please sign in again.");
        return;
      }

      console.error(err);
      onError(err instanceof Error ? err.message : "Failed to reach the API. Is backend running?");
    } finally {
      setLoading(false);
    }
  }

  function handleLanguageChange(e: ChangeEvent<HTMLSelectElement>) {
    setLanguage(e.target.value as AnalysisLanguage);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-300">
          Language
        </label>
        <select
          value={language}
          onChange={handleLanguageChange}
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d2d4e] text-white focus:outline-none disabled:opacity-60"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
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
          placeholder={language === "python" ? "# Paste your code here..." : "// Paste your code here..."}
          disabled={loading}
          className="w-full h-64 px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d2d4e] text-sm font-mono text-gray-200 focus:outline-none resize-y disabled:opacity-60"
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
