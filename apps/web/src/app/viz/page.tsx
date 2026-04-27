"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

type Complexity = {
  timeBest: string | null;
  timeAverage: string | null;
  timeWorst: string | null;
  space: string | null;
};

type AlgorithmListItem = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  difficulty: string;
  complexity: Complexity | null;
};

export default function AlgorithmListPage() {
  const router = useRouter();
  const [algorithms, setAlgorithms] = useState<AlgorithmListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/algorithms`, {
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? "Failed to fetch algorithms");
        }

        const data = await res.json();
        setAlgorithms(data as AlgorithmListItem[]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Loading algorithms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Algorithms ({algorithms.length})</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/getviz"
            style={{
              padding: "6px 14px",
              background: "#1a1a1a",
              color: "white",
              textDecoration: "none",
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            + Seed Data
          </a>
          <button
            onClick={() => setShowRaw((v) => !v)}
            style={{
              padding: "6px 14px",
              background: "#eee",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {showRaw ? "Hide" : "Show"} Raw JSON
          </button>
        </div>
      </div>

      {algorithms.length === 0 ? (
        <p style={{ color: "#888" }}>
          No algorithms found.{" "}
          <a href="/getviz" style={{ color: "blue" }}>
            Seed some data →
          </a>
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {algorithms.map((algo) => (
            <div
              key={algo.id}
              onClick={() => router.push(`/viz/${algo.slug}`)}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                cursor: "pointer",
                background: "#fff",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#666";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#ddd";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 6,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{algo.name}</h3>
                  <span style={{ fontSize: 12, color: "#888", marginTop: 2, display: "block" }}>
                    slug: {algo.slug}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    background: difficultyColor(algo.difficulty),
                    padding: "2px 10px",
                    borderRadius: 12,
                    fontWeight: 500,
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                  }}
                >
                  {algo.difficulty}
                </span>
              </div>

              {algo.complexity ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 8,
                    marginTop: 10,
                    fontSize: 13,
                  }}
                >
                  <ComplexityBadge label="Best" value={algo.complexity.timeBest} />
                  <ComplexityBadge label="Average" value={algo.complexity.timeAverage} />
                  <ComplexityBadge label="Worst" value={algo.complexity.timeWorst} />
                  <ComplexityBadge label="Space" value={algo.complexity.space} />
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#aaa", margin: "8px 0 0" }}>
                  No complexity data
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showRaw && (
        <div style={{ marginTop: 32 }}>
          <h4 style={{ marginBottom: 8 }}>Raw JSON</h4>
          <pre
            style={{
              background: "#f5f5f5",
              border: "1px solid #e0e0e0",
              padding: 16,
              borderRadius: 6,
              overflow: "auto",
              fontSize: 12,
              lineHeight: 1.5,
              maxHeight: 500,
            }}
          >
            {JSON.stringify(algorithms, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ComplexityBadge({ label, value }: { label: string; value: string | null }) {
  return (
    <div
      style={{
        background: "#f8f8f8",
        border: "1px solid #eee",
        borderRadius: 6,
        padding: "4px 8px",
      }}
    >
      <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{value ?? "—"}</div>
    </div>
  );
}

function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "beginner":
      return "#dcfce7";
    case "intermediate":
      return "#fef9c3";
    case "advanced":
      return "#fee2e2";
    default:
      return "#f3f4f6";
  }
}