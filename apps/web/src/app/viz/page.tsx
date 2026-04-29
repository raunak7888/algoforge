//# filename: apps/web/src/app/viz/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

// ---------------------------------------------------------------------------
// Types matching updated backend schema
// ---------------------------------------------------------------------------
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
  difficulty: "beginner" | "intermediate" | "advanced";
  complexity: Complexity | null;
};

type DisplayCode = { language: string; code: string };

type Tag = { id: string; label: string };

type ForgeConfig = {
  forgeCode: {
    version: number;
    language: string;
    body: string;
    requiredStructures: string[];
  };
  inputSchema: Record<string, unknown>;
  guardRanges: Record<string, unknown>;
  version?: number;
};

type AlgorithmDetail = AlgorithmListItem & {
  description: string;
  displayCode: DisplayCode | null;   // single entry resolved by ?lang=
  tags: Tag[];
  forge?: ForgeConfig | null;
};

type ViewMode = "list" | "detail" | "full";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function difficultyBg(d: string) {
  return d === "beginner" ? "#dcfce7" : d === "intermediate" ? "#fef9c3" : "#fee2e2";
}

function Badge({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ background: "#f8f8f8", border: "1px solid #eee", borderRadius: 6, padding: "5px 10px" }}>
      <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{value ?? "—"}</div>
    </div>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre style={{ background: "#1e1e1e", color: "#d4d4d4", padding: 14, borderRadius: 8, overflow: "auto", fontSize: 11, lineHeight: 1.6, margin: "10px 0 0", maxHeight: 380 }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AlgorithmListPage() {
  const router = useRouter();

  const [listItems, setListItems] = useState<AlgorithmListItem[]>([]);
  const [detailMap, setDetailMap] = useState<Record<string, AlgorithmDetail>>({});
  const [fullMap, setFullMap] = useState<Record<string, AlgorithmDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("list");
  const [showJson, setShowJson] = useState(false);
  const [lang, setLang] = useState<"javascript" | "python">("javascript");

  // Load list on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/algorithms`, { credentials: "include" });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d as { error?: string }).error ?? "Failed to load algorithms.");
        }
        setListItems(await res.json() as AlgorithmListItem[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // Load detailed data when mode requires it
  useEffect(() => {
    if (mode === "list" || listItems.length === 0) return;
    const includeFull = mode === "full";

    async function loadDetails() {
      const results: AlgorithmDetail[] = await Promise.all(
        listItems.map(async (item) => {
          const url = `${API_URL}/api/algorithms/slug/${item.slug}?lang=${lang}`;
          const res = await fetch(url, { credentials: "include" });
          if (!res.ok) return item as unknown as AlgorithmDetail;
          return res.json() as Promise<AlgorithmDetail>;
        }),
      );

      const map: Record<string, AlgorithmDetail> = {};
      results.forEach((r) => { map[r.slug] = r; });

      if (includeFull) {
        // Also fetch forge execution payload for each
        const withForge = await Promise.all(
          results.map(async (r) => {
            if (r.forge) return r; // already present
            const res = await fetch(`${API_URL}/api/algorithms/id/${r.id}/visualize`, {
              credentials: "include",
            });
            if (!res.ok) return r;
            const exec = await res.json() as { forge?: ForgeConfig };
            return { ...r, forge: exec.forge ?? null };
          }),
        );
        const fullMap2: Record<string, AlgorithmDetail> = {};
        withForge.forEach((r) => { fullMap2[r.slug] = r; });
        setFullMap(fullMap2);
      } else {
        setDetailMap(map);
      }
    }

    void loadDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lang]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  function renderListCard(a: AlgorithmListItem) {
    return (
      <div
        key={a.id}
        onClick={() => router.push(`/viz/${a.slug}`)}
        style={cardStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#666"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#ddd"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</span>
            <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{a.slug}</span>
          </div>
          <span style={{ fontSize: 11, background: difficultyBg(a.difficulty), padding: "2px 10px", borderRadius: 12, fontWeight: 500, textTransform: "capitalize" as const }}>
            {a.difficulty}
          </span>
        </div>
        {a.complexity ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            <Badge label="Best" value={a.complexity.timeBest} />
            <Badge label="Average" value={a.complexity.timeAverage} />
            <Badge label="Worst" value={a.complexity.timeWorst} />
            <Badge label="Space" value={a.complexity.space} />
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "#aaa" }}>No complexity data</span>
        )}
      </div>
    );
  }

  function renderDetailCard(a: AlgorithmListItem) {
    const detail = detailMap[a.slug];
    return (
      <div key={a.id} style={{ ...cardStyle, cursor: "default" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</span>
            <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{a.slug}</span>
          </div>
          <span style={{ fontSize: 11, background: difficultyBg(a.difficulty), padding: "2px 10px", borderRadius: 12, fontWeight: 500, textTransform: "capitalize" as const }}>
            {a.difficulty}
          </span>
        </div>
        {detail ? (
          <>
            <p style={{ fontSize: 13, color: "#444", margin: "0 0 10px", lineHeight: 1.6 }}>{detail.description}</p>
            {detail.complexity && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
                <Badge label="Best" value={detail.complexity.timeBest} />
                <Badge label="Average" value={detail.complexity.timeAverage} />
                <Badge label="Worst" value={detail.complexity.timeWorst} />
                <Badge label="Space" value={detail.complexity.space} />
              </div>
            )}
            {detail.tags.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 10 }}>
                {detail.tags.map((t) => (
                  <span key={t.id} style={{ fontSize: 11, background: "#f0f0f0", padding: "2px 8px", borderRadius: 10 }}>{t.label}</span>
                ))}
              </div>
            )}
            {detail.displayCode && (
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                  Display code · <strong>{detail.displayCode.language}</strong>
                </div>
                <pre style={{ background: "#f5f5f5", border: "1px solid #eee", borderRadius: 6, padding: 12, overflow: "auto", fontSize: 11, lineHeight: 1.6, margin: 0, maxHeight: 200 }}>
                  {detail.displayCode.code}
                </pre>
              </div>
            )}
          </>
        ) : (
          <span style={{ fontSize: 12, color: "#aaa" }}>Loading detail...</span>
        )}
      </div>
    );
  }

  function renderFullCard(a: AlgorithmListItem) {
    const detail = fullMap[a.slug];
    return (
      <div key={a.id} style={{ ...cardStyle, cursor: "default" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</span>
            <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>id: {a.id}</span>
          </div>
          <span style={{ fontSize: 11, background: difficultyBg(a.difficulty), padding: "2px 10px", borderRadius: 12, fontWeight: 500, textTransform: "capitalize" as const }}>
            {a.difficulty}
          </span>
        </div>
        {detail ? (
          <>
            <p style={{ fontSize: 13, color: "#444", margin: "0 0 10px", lineHeight: 1.6 }}>{detail.description}</p>
            {detail.complexity && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
                <Badge label="Best" value={detail.complexity.timeBest} />
                <Badge label="Average" value={detail.complexity.timeAverage} />
                <Badge label="Worst" value={detail.complexity.timeWorst} />
                <Badge label="Space" value={detail.complexity.space} />
              </div>
            )}
            {detail.tags.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 10 }}>
                {detail.tags.map((t) => (
                  <span key={t.id} style={{ fontSize: 11, background: "#f0f0f0", padding: "2px 8px", borderRadius: 10 }}>{t.label}</span>
                ))}
              </div>
            )}
            {detail.displayCode && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                  Display code · <strong>{detail.displayCode.language}</strong>
                </div>
                <pre style={{ background: "#f5f5f5", border: "1px solid #eee", borderRadius: 6, padding: 12, overflow: "auto", fontSize: 11, lineHeight: 1.6, margin: 0, maxHeight: 180 }}>
                  {detail.displayCode.code}
                </pre>
              </div>
            )}
            {detail.forge ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#333" }}>Forge Config</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8, fontSize: 12 }}>
                  <div style={{ background: "#f8f8f8", borderRadius: 6, padding: "6px 10px" }}>
                    <span style={{ color: "#888" }}>version: </span>
                    <strong>{detail.forge.forgeCode.version}</strong>
                  </div>
                  <div style={{ background: "#f8f8f8", borderRadius: 6, padding: "6px 10px" }}>
                    <span style={{ color: "#888" }}>language: </span>
                    <strong>{detail.forge.forgeCode.language}</strong>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                  requiredStructures: [{detail.forge.forgeCode.requiredStructures.join(", ")}]
                </div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
                  guardRanges: {JSON.stringify(detail.forge.guardRanges)}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>forge.body (stored-only, not executed server-side):</div>
                <pre style={{ background: "#1e1e1e", color: "#d4d4d4", padding: 12, borderRadius: 8, overflow: "auto", fontSize: 10, lineHeight: 1.6, margin: 0, maxHeight: 220 }}>
                  {detail.forge.forgeCode.body}
                </pre>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#f87171" }}>No forge config stored.</div>
            )}
          </>
        ) : (
          <span style={{ fontSize: 12, color: "#aaa" }}>Loading full data...</span>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // JSON data for current mode
  // ---------------------------------------------------------------------------
  function jsonData() {
    if (mode === "list") return listItems;
    if (mode === "detail") return Object.values(detailMap);
    return Object.values(fullMap);
  }

  // ---------------------------------------------------------------------------
  // Page
  // ---------------------------------------------------------------------------
  if (loading) return <div style={{ padding: 24 }}>Loading algorithms...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>Error: {error}</div>;

  const modeLabels: Record<ViewMode, string> = {
    list: "List",
    detail: "Detail",
    full: "Full + Forge",
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Algorithms ({listItems.length})</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/seed" style={navLink}>Seed data</a>
          <a href="/admin/upgrade" style={navLink}>Admin upgrade</a>
        </div>
      </div>

      {/* Mode buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
        {(["list", "detail", "full"] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setShowJson(false); }}
            style={{
              padding: "8px 18px",
              border: "1px solid",
              borderColor: mode === m ? "#1a1a1a" : "#ddd",
              background: mode === m ? "#1a1a1a" : "#fff",
              color: mode === m ? "#fff" : "#333",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: mode === m ? 600 : 400,
            }}
          >
            {modeLabels[m]}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {(mode === "detail" || mode === "full") && (
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as "javascript" | "python")}
              style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          )}
          <button
            onClick={() => setShowJson((v) => !v)}
            style={{ padding: "7px 14px", background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
          >
            {showJson ? "Hide JSON" : "Show JSON"}
          </button>
        </div>
      </div>

      {/* Mode description */}
      <div style={{ fontSize: 12, color: "#888", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
        {mode === "list" && "Compact list view. Click a card to open the algorithm page."}
        {mode === "detail" && "Full metadata including description, display code, and tags. Language resolved server-side via ?lang= query param."}
        {mode === "full" && "Everything in detail plus forge config: body, guardRanges, inputSchema. Forge code is stored-only and never executed by the server."}
      </div>

      {/* Cards */}
      {listItems.length === 0 ? (
        <p style={{ color: "#888" }}>No algorithms. <a href="/seed">Seed some →</a></p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {listItems.map((a) => {
            if (mode === "list") return renderListCard(a);
            if (mode === "detail") return renderDetailCard(a);
            return renderFullCard(a);
          })}
        </div>
      )}

      {/* JSON panel */}
      {showJson && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#333" }}>
            JSON · mode: <span style={{ fontFamily: "monospace" }}>{mode}</span>
          </div>
          <JsonBlock data={jsonData()} />
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  cursor: "pointer",
  background: "#fff",
  transition: "border-color 0.15s",
};

const navLink: React.CSSProperties = {
  padding: "6px 12px",
  background: "#eee",
  textDecoration: "none",
  color: "#333",
  borderRadius: 6,
  fontSize: 13,
};