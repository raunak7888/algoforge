"use client";

import type { AnalysisResponse } from "@/app/page";

type Props = {
  result: AnalysisResponse;
};

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: "#1a1a2e",
      border: `1px solid ${color}`,
      borderRadius: 8,
      padding: "16px 20px",
      flex: "1 1 0",
      minWidth: 160,
    }}>
      <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: 1 }}>
        {label}
      </p>
      <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 700, color }}>
        {value}
      </p>
    </div>
  );
}

export function AnalysisResult({ result }: Props) {
  return (
    <div style={{
      marginTop: 32,
      background: "#111827",
      border: "1px solid #1f2937",
      borderRadius: 12,
      padding: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#f9fafb" }}>Analysis Result</h2>
        <span style={{ fontSize: 11, color: "#4b5563" }}>ID: {result.id}</span>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 20 }}>
        <Badge label="Complexity" value={result.complexity} color="#a78bfa" />
        <Badge label="Est. Runtime" value={result.timeEstimate} color="#34d399" />
        <Badge label="Language" value={result.language.toUpperCase()} color="#60a5fa" />
      </div>

      <div style={{
        background: "#1a1a2e",
        border: "1px solid #2d2d4e",
        borderRadius: 8,
        padding: "16px 20px",
      }}>
        <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
          Suggestion
        </p>
        <p style={{ margin: 0, fontSize: 15, color: "#d1d5db", lineHeight: 1.6 }}>
          💡 {result.suggestion}
        </p>
      </div>

      <p style={{ margin: "16px 0 0", fontSize: 12, color: "#374151" }}>
        Stored at {new Date(result.createdAt).toLocaleString()}
      </p>
    </div>
  );
}
