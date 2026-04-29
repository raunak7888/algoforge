// filename: apps/web/src/app/admin/upgrade/page.tsx

"use client";

import { useState } from "react";
import { API_URL } from "@/lib/config";

// ---------------------------------------------------------------------------
// CSRF helper — reads the af_csrf cookie set by the backend
// ---------------------------------------------------------------------------
function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(^| )af_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : "";
}

type ResultUser = { id: string; email: string | null; role: string };
type Result = { changed: boolean; user: ResultUser };
type Status = "idle" | "loading" | "success" | "error";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AdminUpgradePage() {
  const [userId, setUserId] = useState("");
  const [secret, setSecret] = useState("");
  const [useSecret, setUseSecret] = useState(false);
  const [action, setAction] = useState<"upgrade" | "downgrade">("upgrade");

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function submit() {
    const id = userId.trim();
    if (!id) { setErrorMsg("User ID is required."); setStatus("error"); return; }

    setStatus("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const csrf = getCsrfToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        // X-Admin-Secret is the env-var-based bootstrap path.
        // Never send the role in the body — backend ignores it anyway.
        ...(useSecret && secret.trim() ? { "X-Admin-Secret": secret.trim() } : {}),
      };

      const path = action === "upgrade" ? "/api/admin/upgrade-user" : "/api/admin/downgrade-user";

      const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        credentials: "include",   // sends JWT cookie for auth path
        headers,
        body: JSON.stringify({ userId: id }),
        // NOTE: role is NEVER sent — the server always hardcodes it per endpoint
      });

      const data = await res.json().catch(() => ({})) as Partial<Result & { error?: string }>;

      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status}).`);
      }

      setResult(data as Result);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  const statusColor = status === "success" ? "#166534" : status === "error" ? "#991b1b" : "#1a1a1a";
  const statusBg   = status === "success" ? "#f0fdf4" : status === "error" ? "#fef2f2" : "#fff";

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h2 style={{ margin: 0 }}>Admin · User Role Manager</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/viz" style={navLink}>← Algorithms</a>
          <a href="/seed" style={navLink}>Seed data</a>
        </div>
      </div>

      {/* Security note */}
      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e", marginBottom: 22, lineHeight: 1.7 }}>
        <strong>Security notes</strong><br />
        · Role is <em>never</em> sent in the request body — the server hardcodes it per endpoint.<br />
        · Two auth paths: (1) logged-in ADMIN session cookie, or (2) <code>ADMIN_UPGRADE_SECRET</code> env var via header.<br />
        · CSRF token is always required.
      </div>

      {/* Form */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 22, background: "#fafafa" }}>
        {/* Action selector */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Action</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["upgrade", "downgrade"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAction(a)}
                style={{
                  padding: "8px 20px",
                  border: "1px solid",
                  borderColor: action === a ? "#1a1a1a" : "#ddd",
                  background: action === a ? "#1a1a1a" : "#fff",
                  color: action === a ? "#fff" : "#333",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: action === a ? 600 : 400,
                  textTransform: "capitalize" as const,
                }}
              >
                {a === "upgrade" ? "→ ADMIN" : "→ USER"}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#888", margin: "6px 0 0" }}>
            {action === "upgrade"
              ? "Promotes the user to ADMIN. Requires existing ADMIN session or env secret."
              : "Demotes the user back to USER. Same access requirements."}
          </p>
        </div>

        {/* User ID */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>User ID (cuid / uuid)</label>
          <input
            type="text"
            placeholder="e.g. clxyz123..."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: "#999", margin: "4px 0 0" }}>
            Find user IDs at <code>GET /api/admin/users</code> (requires admin access).
          </p>
        </div>

        {/* Auth path toggle */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={useSecret}
              onChange={(e) => setUseSecret(e.target.checked)}
              style={{ width: 14, height: 14 }}
            />
            Use env secret instead of session cookie
          </label>
          <p style={{ fontSize: 11, color: "#999", margin: "4px 0 0 22px" }}>
            Use this for first-time bootstrap when no ADMIN account exists yet.
          </p>
        </div>

        {/* Secret field */}
        {useSecret && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>ADMIN_UPGRADE_SECRET value</label>
            <input
              type="password"
              placeholder="Enter the secret from your .env file"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              style={inputStyle}
              autoComplete="off"
            />
            <p style={{ fontSize: 11, color: "#999", margin: "4px 0 0" }}>
              Sent as <code>X-Admin-Secret</code> header. Never stored client-side.
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() => void submit()}
          disabled={status === "loading"}
          style={{
            width: "100%",
            padding: "10px 0",
            background: status === "loading" ? "#aaa" : "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: status === "loading" ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {status === "loading"
            ? "Processing..."
            : action === "upgrade"
            ? "Upgrade to ADMIN"
            : "Downgrade to USER"}
        </button>
      </div>

      {/* Result */}
      {(status === "success" || status === "error") && (
        <div style={{ marginTop: 18, border: `1px solid ${status === "success" ? "#bbf7d0" : "#fecaca"}`, borderRadius: 8, padding: 16, background: statusBg }}>
          <div style={{ fontWeight: 600, color: statusColor, marginBottom: 8 }}>
            {status === "success" ? "✓ Success" : "✗ Error"}
          </div>
          {status === "success" && result ? (
            <>
              <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.8 }}>
                <div><strong>Changed:</strong> {result.changed ? "Yes" : "No (already at target role)"}</div>
                <div><strong>User ID:</strong> <code>{result.user.id}</code></div>
                <div><strong>Email:</strong> {result.user.email ?? "—"}</div>
                <div><strong>Role (now):</strong> <code style={{ background: result.user.role === "ADMIN" ? "#dcfce7" : "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>{result.user.role}</code></div>
              </div>
              <pre style={{ background: "#1e1e1e", color: "#d4d4d4", padding: 10, borderRadius: 6, fontSize: 11, marginTop: 12, overflow: "auto" }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#991b1b" }}>{errorMsg}</div>
          )}
        </div>
      )}

      {/* Quick lookup hint */}
      <div style={{ marginTop: 28, borderTop: "1px solid #eee", paddingTop: 20 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>Find a User ID</h3>
        <p style={{ fontSize: 12, color: "#666", lineHeight: 1.7, margin: 0 }}>
          Run <code>GET /api/admin/users</code> — requires an active ADMIN session or the <code>X-Admin-Secret</code> header.<br />
          The endpoint returns <code>id</code>, <code>email</code>, <code>name</code>, <code>role</code>, <code>createdAt</code>.
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#333",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 13,
  boxSizing: "border-box",
  fontFamily: "monospace",
};

const navLink: React.CSSProperties = {
  padding: "6px 12px",
  background: "#eee",
  textDecoration: "none",
  color: "#333",
  borderRadius: 6,
  fontSize: 13,
};