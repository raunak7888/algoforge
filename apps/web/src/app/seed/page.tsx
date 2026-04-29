//# filename: apps/web/src/app/seed/page.tsx

"use client";

import { useState } from "react";
import { API_URL } from "@/lib/config";

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(^| )af_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : "";
}

type LogEntry = { type: "info" | "success" | "error"; message: string };

// ---------------------------------------------------------------------------
// Forge body — stored only, NEVER executed server-side
// ---------------------------------------------------------------------------
const FORGE_BODY = `const arr = [...input.array];
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
      const tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
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

const JS_CODE = `function bubbleSort(arr) {
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

const PYTHON_CODE = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`;

// ---------------------------------------------------------------------------
// Payload — matches updated backend schema exactly
// ---------------------------------------------------------------------------
const BUBBLE_SORT_PAYLOAD = {
  slug: "bubble-sort",
  name: "Bubble Sort",
  description:
    "A simple comparison-based sorting algorithm. It repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.",
  categoryId: "sorting",
  difficulty: "beginner",
  isPublished: true,

  complexity: {
    time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
    space: "O(1)",
  },

  // Array of display-code variants — backend stores all, client requests ?lang=
  displayCodes: [
    { language: "javascript", code: JS_CODE },
    { language: "python", code: PYTHON_CODE },
  ],

  forge: {
    forgeCode: {
      version: 1,
      language: "js",       // must be "js" — forge is always JS
      body: FORGE_BODY,
      requiredStructures: ["array"],
    },
    // inputSchema is a free-form JSON record describing expected input shape
    inputSchema: {
      array: { type: "array", items: { type: "number" } },
    },
    // guardRanges.array REQUIRED because requiredStructures includes "array"
    guardRanges: {
      array: {
        minLength: 2,
        maxLength: 30,
        minVal: 1,
        maxVal: 100,
      },
    },
  },

  tags: ["sorting", "array", "comparison", "beginner"],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  function addLog(type: LogEntry["type"], msg: string) {
    setLog((p) => [...p, { type, message: msg }]);
  }

  async function post(path: string, body: unknown) {
    const csrf = getCsrfToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function get(path: string) {
    const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function seed() {
    setLoading(true);
    setLog([]);

    try {
      // ── 1. Category ──────────────────────────────────────────────────────
      addLog("info", "Checking categories...");
      const catListResult = await get("/api/categories");
      if (!catListResult.ok) throw new Error("Failed to fetch categories.");

      const cats = catListResult.data as { id: string; label: string }[];
      const existing = cats.find(
        (c) => c.id === "sorting" || c.label.toLowerCase() === "sorting",
      );

      let categoryId: string;
      if (existing) {
        categoryId = existing.id;
        addLog("info", `Category exists → id: ${categoryId}`);
      } else {
        addLog("info", "Creating 'Sorting' category...");
        const r = await post("/api/categories", {
          id: "sorting",
          label: "Sorting",
          description: "Sorting algorithms",
          iconName: "ArrowUpDown",
          sortOrder: 1,
        });
        if (!r.ok) throw new Error((r.data as { error?: string }).error ?? "Category creation failed.");
        categoryId = (r.data as { id: string }).id;
        addLog("success", `Category created → id: ${categoryId}`);
      }

      // ── 2. Idempotency check ─────────────────────────────────────────────
      addLog("info", "Checking if bubble-sort already exists...");
      const check = await get("/api/algorithms/slug/bubble-sort");
      if (check.ok) {
        addLog("info", "bubble-sort already exists — skipping.");
        addLog("success", "Done. No duplicates created.");
        return;
      }

      // ── 3. Create algorithm ──────────────────────────────────────────────
      addLog("info", "Creating Bubble Sort algorithm...");
      const payload = { ...BUBBLE_SORT_PAYLOAD, categoryId };
      const result = await post("/api/algorithms", payload);

      if (!result.ok) {
        const err = result.data as { error?: string };
        throw new Error(err.error ?? "Algorithm creation failed.");
      }

      addLog("success", "Algorithm created successfully.");
      addLog("info", `id: ${(result.data as { id?: string }).id ?? "—"}`);
      addLog("info", "displayCodes: javascript + python stored.");
      addLog("info", "forge.guardRanges.array: minLength=2, maxLength=30");
      addLog("success", "Seeding complete. Visit /viz to explore.");
    } catch (err) {
      addLog("error", err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const logColor = (t: LogEntry["type"]) =>
    t === "success" ? "#4ade80" : t === "error" ? "#f87171" : "#d1d5db";

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Algorithm Seeder</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/viz" style={linkStyle}>← View algorithms</a>
          <a href="/admin/upgrade" style={linkStyle}>Admin upgrade →</a>
        </div>
      </div>

      {/* Card */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20, background: "#fafafa", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 6px" }}>Bubble Sort</h3>
        <p style={{ margin: "0 0 14px", color: "#555", fontSize: 13 }}>
          Seeds a Sorting category and Bubble Sort algorithm with JS + Python display
          codes. Idempotent — safe to run multiple times.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Best", value: "O(n)" },
            { label: "Average", value: "O(n²)" },
            { label: "Worst", value: "O(n²)" },
            { label: "Space", value: "O(1)" },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "#666", marginBottom: 14, lineHeight: 1.7 }}>
          <strong>displayCodes:</strong> javascript, python<br />
          <strong>requiredStructures:</strong> ["array"]<br />
          <strong>guardRanges.array:</strong> length 2–30, values 1–100<br />
          <strong>tags:</strong> sorting, array, comparison, beginner
        </div>

        <button
          onClick={() => void seed()}
          disabled={loading}
          style={{
            padding: "10px 22px",
            background: loading ? "#aaa" : "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {loading ? "Seeding..." : "Seed Bubble Sort"}
        </button>
      </div>

      {/* Log output */}
      {log.length > 0 && (
        <div style={{ border: "1px solid #333", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ background: "#1e1e1e", padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#aaa", fontSize: 12 }}>Output</span>
            <button onClick={() => setLog([])} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: 12 }}>
              Clear
            </button>
          </div>
          <div style={{ background: "#1e1e1e", padding: 14, maxHeight: 320, overflow: "auto", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7 }}>
            {log.map((e, i) => (
              <div key={i} style={{ color: logColor(e.type), whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {e.type === "success" ? "✓ " : e.type === "error" ? "✗ " : "· "}{e.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forge preview */}
      <h3 style={{ marginBottom: 8 }}>Forge Code (stored, not executed server-side)</h3>
      <pre style={{ background: "#1e1e1e", color: "#d4d4d4", padding: 14, borderRadius: 8, overflow: "auto", fontSize: 11, lineHeight: 1.6, maxHeight: 280 }}>
        {FORGE_BODY}
      </pre>

      {/* Payload preview */}
      <h3 style={{ marginBottom: 8, marginTop: 24 }}>Full Payload</h3>
      <pre style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", padding: 14, borderRadius: 8, overflow: "auto", fontSize: 11, lineHeight: 1.6, maxHeight: 320 }}>
        {JSON.stringify(BUBBLE_SORT_PAYLOAD, null, 2)}
      </pre>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "#eee",
  textDecoration: "none",
  color: "#333",
  borderRadius: 6,
  fontSize: 13,
};