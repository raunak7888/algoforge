"use client";

import { useState } from "react";
import { API_URL } from "@/lib/config";

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(^| )af_csrf=([^;]+)/);
  return match ? match[2] : "";
}

type LogEntry = {
  type: "info" | "success" | "error";
  message: string;
};

const BUBBLE_SORT_FORGE_BODY = `const arr = [...input.array];
forge.init("array", "arr", arr);
forge.setMessage("Starting Bubble Sort");
forge.snap();
const n = arr.length;
for (let i = 0; i < n - 1; i++) {
  forge.setPhase("Pass " + (i + 1));
  for (let j = 0; j < n - 1 - i; j++) {
    forge.highlight("arr", [j, j + 1], "comparing");
    forge.setPointers("arr", { j: j, "j+1": j + 1 });
    forge.setMessage("Comparing " + arr[j] + " and " + arr[j + 1]);
    forge.snap();
    if (arr[j] > arr[j + 1]) {
      const tmp = arr[j];
      arr[j] = arr[j + 1];
      arr[j + 1] = tmp;
      forge.swap("arr", j, j + 1);
      forge.highlight("arr", [j, j + 1], "swapped");
      forge.setMessage("Swapped → " + arr[j] + " and " + arr[j + 1]);
      forge.snap();
    }
  }
  forge.markSorted("arr", n - 1 - i);
  forge.setMessage("Position " + (n - 1 - i) + " is now sorted");
  forge.snap();
}
forge.markAllSorted("arr");
forge.setMessage("Array is fully sorted!");
forge.done();`;

const BUBBLE_SORT_JS_CODE = `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`;

const BUBBLE_SORT_PYTHON_CODE = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`;

export default function AlgorithmSeederPage() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  function addLog(type: LogEntry["type"], message: string) {
    setLog((prev) => [...prev, { type, message }]);
  }

  async function apiPost(path: string, body: unknown): Promise<{ ok: boolean; data: unknown }> {
    const csrfToken = getCsrfToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function apiGet(path: string): Promise<{ ok: boolean; data: unknown }> {
    const res = await fetch(`${API_URL}${path}`, {
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function seedBubbleSort() {
    setLoading(true);
    setLog([]);

    try {
      // ── STEP 1: Ensure "Sorting" category exists ──────────────────────────
      addLog("info", "Checking for existing categories...");

      const categoriesResult = await apiGet("/api/categories");
      if (!categoriesResult.ok) {
        throw new Error("Failed to fetch categories");
      }

      const categories = categoriesResult.data as Array<{ id: string; label: string }>;
      const existingCategory = categories.find(
        (c) => c.label.toLowerCase() === "sorting" || c.id === "sorting",
      );

      let categoryId: string;

      if (existingCategory) {
        categoryId = existingCategory.id;
        addLog("info", `Category already exists (id: ${categoryId})`);
      } else {
        addLog("info", "Creating 'Sorting' category...");

        const catResult = await apiPost("/api/categories", {
          id: "sorting",
          label: "Sorting",
          description: "Sorting algorithms",
          iconName: "ArrowUpDown",
          sortOrder: 1,
        });

        if (!catResult.ok) {
          const err = catResult.data as { error?: string };
          throw new Error(err.error ?? "Failed to create category");
        }

        categoryId = (catResult.data as { id: string }).id;
        addLog("success", `Category created (id: ${categoryId})`);
      }

      // ── STEP 2: Check if algorithm already exists ─────────────────────────
      addLog("info", "Checking if Bubble Sort already exists...");

      const algoCheckResult = await apiGet("/api/algorithms/slug/bubble-sort");
      if (algoCheckResult.ok) {
        addLog("info", "Algorithm 'bubble-sort' already exists — skipping creation.");
        addLog("success", "Done. No duplicates created.");
        return;
      }

      // ── STEP 3: Create the Algorithm ──────────────────────────────────────
      addLog("info", "Creating Bubble Sort algorithm...");

      const algoResult = await apiPost("/api/algorithms", {
        slug: "bubble-sort",
        name: "Bubble Sort",
        description:
          "A simple comparison-based sorting algorithm. It repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.",
        categoryId,
        difficulty: "beginner",
        isPublished: true,
      });

      if (!algoResult.ok) {
        const err = algoResult.data as { error?: string };
        throw new Error(err.error ?? "Failed to create algorithm");
      }

      addLog("success", "Algorithm created.");

      // ── Summary ───────────────────────────────────────────────────────────
      addLog("info", "─────────────────────────────────────");
      addLog("info", `Forge Code (JS):`);
      addLog("info", BUBBLE_SORT_FORGE_BODY.substring(0, 120) + "...");
      addLog("info", "─────────────────────────────────────");
      addLog("info", `Display Code (JS):\n${BUBBLE_SORT_JS_CODE}`);
      addLog("info", "─────────────────────────────────────");
      addLog("info", `Display Code (Python):\n${BUBBLE_SORT_PYTHON_CODE}`);
      addLog("info", "─────────────────────────────────────");
      addLog(
        "info",
        "Note: Complexity, DisplayCode, and ForgeCode require dedicated backend endpoints not yet exposed via the API.",
      );
      addLog("success", "🎉 Seeding complete. Visit /viz to see the algorithm list.");
    } catch (err: unknown) {
      addLog("error", `❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Algorithm Seeder</h2>
        <a
          href="/viz"
          style={{
            padding: "6px 14px",
            background: "#eee",
            textDecoration: "none",
            color: "#333",
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          ← View Algorithms
        </a>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
          background: "#fafafa",
        }}
      >
        <h3 style={{ margin: "0 0 8px" }}>Bubble Sort</h3>
        <p style={{ margin: "0 0 16px", color: "#555", fontSize: 14 }}>
          Seeds a "Sorting" category and a "Bubble Sort" algorithm. Idempotent — will not duplicate
          if run multiple times.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Best", value: "O(n)" },
            { label: "Average", value: "O(n²)" },
            { label: "Worst", value: "O(n²)" },
            { label: "Space", value: "O(1)" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 6,
                padding: "8px 12px",
              }}
            >
              <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => void seedBubbleSort()}
          disabled={loading}
          style={{
            padding: "10px 24px",
            background: loading ? "#888" : "#1a1a1a",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {loading ? "Seeding..." : "Seed Bubble Sort"}
        </button>
      </div>

      {log.length > 0 && (
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#1e1e1e",
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#aaa", fontSize: 13 }}>Output</span>
            <button
              onClick={() => setLog([])}
              style={{
                background: "transparent",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Clear
            </button>
          </div>
          <div
            style={{
              background: "#1e1e1e",
              padding: 16,
              maxHeight: 400,
              overflow: "auto",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {log.map((entry, i) => (
              <div
                key={i}
                style={{
                  color:
                    entry.type === "success"
                      ? "#4ade80"
                      : entry.type === "error"
                        ? "#f87171"
                        : "#d1d5db",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {entry.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 12 }}>Forge Code Preview</h3>
        <pre
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: 16,
            borderRadius: 8,
            overflow: "auto",
            fontSize: 12,
            lineHeight: 1.6,
            maxHeight: 300,
          }}
        >
          <code>{BUBBLE_SORT_FORGE_BODY}</code>
        </pre>
      </div>
    </div>
  );
}