"use client";

import { useState, useRef, useCallback } from "react";

// ─── Endpoint Config ──────────────────────────────────────────────────────────

const ENDPOINTS = [
  // ── Health ────────────────────────────────────────────────────────────────
  {
    id: "health_check",
    group: "Health",
    method: "GET",
    path: "/health",
    description: "Health check — status + timestamp",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    id: "auth_google_start",
    group: "Auth",
    method: "GET",
    path: "/api/auth/google/start",
    description: "Initiate Google OAuth flow (redirects)",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "auth_me",
    group: "Auth",
    method: "GET",
    path: "/api/auth/me",
    description: "Get authenticated user profile from JWT",
    requiresAuth: true,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "auth_refresh",
    group: "Auth",
    method: "POST",
    path: "/api/auth/refresh",
    description: "Rotate refresh token and issue new access token",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "auth_logout",
    group: "Auth",
    method: "POST",
    path: "/api/auth/logout",
    description: "Revoke current session and clear auth cookies",
    requiresAuth: false,
    requiresCsrf: true,
    pathParams: [],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "auth_logout_all",
    group: "Auth",
    method: "POST",
    path: "/api/auth/logout-all",
    description: "Revoke ALL user sessions",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "auth_admin_users",
    group: "Auth",
    method: "GET",
    path: "/api/auth/admin/users",
    description: "List all users (ADMIN only)",
    requiresAuth: true,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },

  // ── Algorithms ────────────────────────────────────────────────────────────
  {
    id: "algo_list",
    group: "Algorithms",
    method: "GET",
    path: "/api/algorithms",
    description: "List published algorithms with optional filters",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [
      { name: "categoryId", placeholder: "e.g. sorting" },
      { name: "difficulty", placeholder: "beginner | intermediate | advanced" },
      { name: "isPublished", placeholder: "true | false" },
      { name: "search", placeholder: "e.g. bubble" },
    ],
    defaultBody: null,
    seed: null,
  },
  {
    id: "algo_get_by_id",
    group: "Algorithms",
    method: "GET",
    path: "/api/algorithms/id/:id",
    description: "Fetch full algorithm detail by UUID",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [{ name: "id", placeholder: "UUID or cuid" }],
    queryParams: [{ name: "lang", placeholder: "javascript | python" }],
    defaultBody: null,
    seed: null,
  },
  {
    id: "algo_get_by_slug",
    group: "Algorithms",
    method: "GET",
    path: "/api/algorithms/slug/:slug",
    description: "Fetch algorithm detail by slug",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [{ name: "slug", placeholder: "e.g. bubble-sort" }],
    queryParams: [{ name: "lang", placeholder: "javascript | python" }],
    defaultBody: null,
    seed: null,
  },
  {
    id: "algo_visualize",
    group: "Algorithms",
    method: "GET",
    path: "/api/algorithms/id/:id/visualize",
    description: "Returns forge/visualization config for an algorithm",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [{ name: "id", placeholder: "UUID or cuid" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "algo_create",
    group: "Algorithms",
    method: "POST",
    path: "/api/algorithms",
    description: "Create a new algorithm (ADMIN only)",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [],
    queryParams: [],
    defaultBody: JSON.stringify(
      {
        slug: "bubble-sort",
        name: "Bubble Sort",
        description: "A simple comparison-based sorting algorithm.",
        categoryId: "sorting",
        difficulty: "beginner",
        isPublished: false,
        complexity: {
          time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
          space: "O(1)",
        },
        displayCodes: [
          {
            language: "javascript",
            code: "function bubbleSort(arr) {\n  for(let i=0;i<arr.length;i++)\n    for(let j=0;j<arr.length-i-1;j++)\n      if(arr[j]>arr[j+1]) [arr[j],arr[j+1]]=[arr[j+1],arr[j]];\n  return arr;\n}",
          },
        ],
        forge: {
          forgeCode: {
            version: 1,
            language: "js",
            body: "// forge body here",
            requiredStructures: ["array"],
          },
          inputSchema: { array: [1, 2, 3] },
          guardRanges: {
            array: { minLength: 2, maxLength: 20, minVal: -100, maxVal: 100 },
          },
        },
        tags: ["sorting", "comparison"],
      },
      null,
      2
    ),
    seed: () => ({
      slug: `algo-${Math.random().toString(36).slice(2, 7)}`,
      name: `Algorithm ${Math.floor(Math.random() * 1000)}`,
      description: "Auto-seeded algorithm description.",
      categoryId: "sorting",
      difficulty: ["beginner", "intermediate", "advanced"][Math.floor(Math.random() * 3)],
      isPublished: false,
      complexity: {
        time: { best: "O(n)", average: "O(n log n)", worst: "O(n²)" },
        space: "O(1)",
      },
      displayCodes: [{ language: "javascript", code: "function algo(arr){ return arr; }" }],
      forge: {
        forgeCode: { version: 1, language: "js", body: "// body", requiredStructures: ["array"] },
        inputSchema: { array: [3, 1, 2] },
        guardRanges: { array: { minLength: 2, maxLength: 10, minVal: 0, maxVal: 99 } },
      },
      tags: ["auto-seeded"],
    }),
  },
  {
    id: "algo_update",
    group: "Algorithms",
    method: "PATCH",
    path: "/api/algorithms/id/:id",
    description: "Update an algorithm by ID (ADMIN only)",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [{ name: "id", placeholder: "UUID or cuid" }],
    queryParams: [],
    defaultBody: JSON.stringify({ name: "Updated Name", isPublished: true }, null, 2),
    seed: () => ({ name: `Updated-${Date.now()}`, isPublished: Math.random() > 0.5 }),
  },
  {
    id: "algo_delete",
    group: "Algorithms",
    method: "DELETE",
    path: "/api/algorithms/id/:id",
    description: "Delete an algorithm by ID (ADMIN only)",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [{ name: "id", placeholder: "UUID or cuid" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },

  // ── Analysis ──────────────────────────────────────────────────────────────
  {
    id: "analysis_list",
    group: "Analysis",
    method: "GET",
    path: "/api/analysis",
    description: "List paginated analysis history for authenticated user",
    requiresAuth: true,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [
      { name: "limit", placeholder: "1-50 (default 10)" },
      { name: "cursor", placeholder: "base64url cursor" },
    ],
    defaultBody: null,
    seed: null,
  },
  {
    id: "analysis_get_by_id",
    group: "Analysis",
    method: "GET",
    path: "/api/analysis/:id",
    description: "Fetch a single analysis by ID",
    requiresAuth: true,
    requiresCsrf: false,
    pathParams: [{ name: "id", placeholder: "analysis cuid" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "analysis_create",
    group: "Analysis",
    method: "POST",
    path: "/api/analysis",
    description: "Run AI code analysis and store result",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [],
    queryParams: [],
    defaultBody: JSON.stringify(
      {
        code: "function twoSum(nums, target) {\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map[comp] !== undefined) return [map[comp], i];\n    map[nums[i]] = i;\n  }\n}",
        language: "javascript",
      },
      null,
      2
    ),
    seed: () => ({
      code: [
        "function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }",
        "function fib(n) { if(n<=1) return n; return fib(n-1)+fib(n-2); }",
        "function linearSearch(arr, t) { for(let i=0;i<arr.length;i++) if(arr[i]===t) return i; return -1; }",
      ][Math.floor(Math.random() * 3)],
      language: Math.random() > 0.5 ? "javascript" : "python",
    }),
  },
  {
    id: "analysis_share",
    group: "Analysis",
    method: "POST",
    path: "/api/analysis/:id/share",
    description: "Make an analysis public and return share URL",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [{ name: "id", placeholder: "analysis cuid" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },

  // ── Explanation (one-shot) ─────────────────────────────────────────────────
  {
    id: "explain_oneshot",
    group: "Explain",
    method: "POST",
    path: "/api/explain",
    description: "One-shot stateless AI explanation of codebase query",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [],
    queryParams: [],
    defaultBody: JSON.stringify({ query: "How does the auth refresh token rotation work?" }, null, 2),
    seed: () => ({
      query: [
        "How does the auth refresh token rotation work?",
        "Explain the layered caching strategy",
        "How does bubble sort work in this codebase?",
        "What happens when an AI rate limit is exceeded?",
        "Explain the analysis service flow",
      ][Math.floor(Math.random() * 5)],
    }),
  },

  // ── Explanation Sessions ───────────────────────────────────────────────────
  {
    id: "session_list",
    group: "Explanation Sessions",
    method: "GET",
    path: "/api/explain/sessions",
    description: "List paginated explanation sessions for user",
    requiresAuth: true,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [
      { name: "limit", placeholder: "1-50 (default 20)" },
      { name: "cursor", placeholder: "session id cursor" },
    ],
    defaultBody: null,
    seed: null,
  },
  {
    id: "session_create",
    group: "Explanation Sessions",
    method: "POST",
    path: "/api/explain/sessions",
    description: "Create a new persistent explanation session",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [],
    queryParams: [],
    defaultBody: JSON.stringify({ title: "My Debug Session" }, null, 2),
    seed: () => ({
      title: `Session ${new Date().toLocaleTimeString()} — ${["Auth Flow", "Cache Layer", "AI Pipeline", "Algorithm API"][Math.floor(Math.random() * 4)]}`,
    }),
  },
  {
    id: "session_get_by_id",
    group: "Explanation Sessions",
    method: "GET",
    path: "/api/explain/sessions/:id",
    description: "Fetch a session with full message history",
    requiresAuth: true,
    requiresCsrf: false,
    pathParams: [{ name: "id", placeholder: "session cuid" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "session_send_message",
    group: "Explanation Sessions",
    method: "POST",
    path: "/api/explain/sessions/:id/messages",
    description: "Send a message to a session (triggers AI, rate limited)",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [{ name: "id", placeholder: "session cuid" }],
    queryParams: [],
    defaultBody: JSON.stringify({ query: "Explain how the token rotation works." }, null, 2),
    seed: () => ({
      query: [
        "Explain how the token rotation works.",
        "Why might analysis creation fail?",
        "Walk me through the BFS algorithm implementation.",
        "How are cache keys structured?",
      ][Math.floor(Math.random() * 4)],
    }),
  },
  {
    id: "session_share",
    group: "Explanation Sessions",
    method: "POST",
    path: "/api/explain/sessions/:id/share",
    description: "Make a session public and return share URL",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [{ name: "id", placeholder: "session cuid" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "session_delete",
    group: "Explanation Sessions",
    method: "DELETE",
    path: "/api/explain/sessions/:id",
    description: "Delete a session permanently",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [{ name: "id", placeholder: "session cuid" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },

  // ── Categories ────────────────────────────────────────────────────────────
  {
    id: "category_list",
    group: "Categories",
    method: "GET",
    path: "/api/categories",
    description: "List all categories sorted by sortOrder",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "category_get_by_id",
    group: "Categories",
    method: "GET",
    path: "/api/categories/:id",
    description: "Get a category by ID",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [{ name: "id", placeholder: "category id" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "category_create",
    group: "Categories",
    method: "POST",
    path: "/api/categories",
    description: "Create a new category (ADMIN only)",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [],
    queryParams: [],
    defaultBody: JSON.stringify(
      { label: "Graph Theory", description: "Graph algorithms", iconName: "graph", sortOrder: 5 },
      null,
      2
    ),
    seed: () => ({
      label: ["Trees", "Dynamic Programming", "Backtracking","sorting", "Greedy", "Divide & Conquer"][Math.floor(Math.random() * 5)],
      description: "Auto-seeded category",
      iconName: "code",
      sortOrder: Math.floor(Math.random() * 20),
    }),
  },
  {
    id: "category_update",
    group: "Categories",
    method: "PATCH",
    path: "/api/categories/:id",
    description: "Update a category (ADMIN only)",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [{ name: "id", placeholder: "category id" }],
    queryParams: [],
    defaultBody: JSON.stringify({ label: "Updated Label", sortOrder: 1 }, null, 2),
    seed: () => ({ label: `Updated-${Date.now()}`, sortOrder: Math.floor(Math.random() * 10) }),
  },
  {
    id: "category_delete",
    group: "Categories",
    method: "DELETE",
    path: "/api/categories/:id",
    description: "Delete a category (ADMIN only, fails if algorithms exist)",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [{ name: "id", placeholder: "category id" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },

  // ── Share ─────────────────────────────────────────────────────────────────
  {
    id: "share_analysis",
    group: "Share",
    method: "GET",
    path: "/api/share/analysis/:shareId",
    description: "Get a publicly shared analysis by shareId",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [{ name: "shareId", placeholder: "base64url shareId" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "share_analysis_legacy",
    group: "Share",
    method: "GET",
    path: "/api/share/:shareId",
    description: "Legacy share route for analysis (backward compat)",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [{ name: "shareId", placeholder: "base64url shareId" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "share_session",
    group: "Share",
    method: "GET",
    path: "/api/share/explain/:shareId",
    description: "Get a publicly shared explanation session",
    requiresAuth: false,
    requiresCsrf: false,
    pathParams: [{ name: "shareId", placeholder: "base64url shareId" }],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    id: "admin_list_users",
    group: "Admin",
    method: "GET",
    path: "/api/admin/users",
    description: "List all users (requireAdminAccess)",
    requiresAuth: true,
    requiresCsrf: false,
    pathParams: [],
    queryParams: [],
    defaultBody: null,
    seed: null,
  },
  {
    id: "admin_upgrade_user",
    group: "Admin",
    method: "POST",
    path: "/api/admin/upgrade-user",
    description: "Promote a user to ADMIN role",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [],
    queryParams: [],
    defaultBody: JSON.stringify({ userId: "replace-with-user-id" }, null, 2),
    seed: null,
  },
  {
    id: "admin_downgrade_user",
    group: "Admin",
    method: "POST",
    path: "/api/admin/downgrade-user",
    description: "Demote a user to USER role",
    requiresAuth: true,
    requiresCsrf: true,
    pathParams: [],
    queryParams: [],
    defaultBody: JSON.stringify({ userId: "replace-with-user-id" }, null, 2),
    seed: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const METHOD_CLASSES = {
  GET: "bg-[#22c55e]",
  POST: "bg-[#3b82f6]",
  PATCH: "bg-[#f59e0b]",
  DELETE: "bg-[#ef4444]",
  PUT: "bg-[#8b5cf6]",
};

function buildUrl(baseUrl, path, pathParams, queryParams) {
  let url = baseUrl + path;
  for (const [key, val] of Object.entries(pathParams)) {
    if (val) url = url.replace(`:${key}`, encodeURIComponent(val));
  }
  const qs = Object.entries(queryParams)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `${url}?${qs}` : url;
}

function tryParseJson(str) {
  if (!str || !str.trim()) return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(str) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function getGroupColor(group) {
  const map = {
    Health: "#10b981",
    Auth: "#6366f1",
    Algorithms: "#f59e0b",
    Analysis: "#ec4899",
    Explain: "#06b6d4",
    "Explanation Sessions": "#8b5cf6",
    Categories: "#14b8a6",
    Share: "#64748b",
    Admin: "#ef4444",
  };
  return map[group] || "#64748b";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApiDashboard() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:4000");
  const [globalHeaders, setGlobalHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [csrfToken, setCsrfToken] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const g = {};
    ENDPOINTS.forEach((e) => { g[e.group] = true; });
    return g;
  });
  const [expandedEndpoints, setExpandedEndpoints] = useState({});
  const [endpointState, setEndpointState] = useState(() => {
    const s = {};
    ENDPOINTS.forEach((ep) => {
      s[ep.id] = {
        pathParams: Object.fromEntries((ep.pathParams || []).map((p) => [p.name, ""])),
        queryParams: Object.fromEntries((ep.queryParams || []).map((p) => [p.name, ""])),
        body: ep.defaultBody || "",
        bodyError: null,
        response: null,
        loading: false,
        responseTime: null,
        activeTab: "pretty",
      };
    });
    return s;
  });
  const [seedLog, setSeedLog] = useState([]);
  const [seedingAll, setSeedingAll] = useState(false);
  const [globalHeadersError, setGlobalHeadersError] = useState(null);
  const logRef = useRef(null);

  const groups = [...new Set(ENDPOINTS.map((e) => e.group))];

  const toggleGroup = (g) =>
    setExpandedGroups((prev) => ({ ...prev, [g]: !prev[g] }));

  const toggleEndpoint = (id) =>
    setExpandedEndpoints((prev) => ({ ...prev, [id]: !prev[id] }));

  const updateEndpointField = useCallback((id, field, value) => {
    setEndpointState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }, []);

  const updatePathParam = useCallback((id, key, value) => {
    setEndpointState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        pathParams: { ...prev[id].pathParams, [key]: value },
      },
    }));
  }, []);

  const updateQueryParam = useCallback((id, key, value) => {
    setEndpointState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        queryParams: { ...prev[id].queryParams, [key]: value },
      },
    }));
  }, []);

  const sendRequest = useCallback(
    async (ep, overrideBody) => {
      const state = endpointState[ep.id];
      const bodyStr = overrideBody !== undefined ? overrideBody : state.body;

      // Validate body JSON
      if (
        bodyStr &&
        bodyStr.trim() &&
        ["POST", "PATCH", "PUT"].includes(ep.method)
      ) {
        const parsed = tryParseJson(bodyStr);
        if (!parsed.ok) {
          updateEndpointField(ep.id, "bodyError", `JSON error: ${parsed.error}`);
          return null;
        }
        updateEndpointField(ep.id, "bodyError", null);
      }

      // Parse global headers
      const ghParsed = tryParseJson(globalHeaders);
      if (!ghParsed.ok) {
        setGlobalHeadersError(`Global headers JSON error: ${ghParsed.error}`);
        return null;
      }
      setGlobalHeadersError(null);

      const headers = { ...(ghParsed.value || {}) };
      if (ep.requiresCsrf && csrfToken) headers["X-CSRF-Token"] = csrfToken;

      const url = buildUrl(baseUrl, ep.path, state.pathParams, state.queryParams);
      const options = { method: ep.method, headers, credentials: "include" };

      if (bodyStr && bodyStr.trim() && ["POST", "PATCH", "PUT"].includes(ep.method)) {
        options.body = bodyStr;
      }

      updateEndpointField(ep.id, "loading", true);
      updateEndpointField(ep.id, "response", null);

      const start = performance.now();
      try {
        const res = await fetch(url, options);
        const elapsed = Math.round(performance.now() - start);
        let data;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          data = await res.text();
        }
        const response = { ok: res.ok, status: res.status, statusText: res.statusText, data, elapsed };
        setEndpointState((prev) => ({
          ...prev,
          [ep.id]: {
            ...prev[ep.id],
            response,
            responseTime: elapsed,
            loading: false,
          },
        }));
        return response;
      } catch (err) {
        const elapsed = Math.round(performance.now() - start);
        const response = { ok: false, status: 0, statusText: "Network Error", data: { message: err.message }, elapsed };
        setEndpointState((prev) => ({
          ...prev,
          [ep.id]: {
            ...prev[ep.id],
            response,
            responseTime: elapsed,
            loading: false,
          },
        }));
        return response;
      }
    },
    [endpointState, baseUrl, globalHeaders, csrfToken, updateEndpointField]
  );

  const seedEndpoint = useCallback(
    async (ep) => {
      if (!ep.seed) return;
      const data = ep.seed();
      const body = JSON.stringify(data, null, 2);
      updateEndpointField(ep.id, "body", body);
      const result = await sendRequest(ep, body);
      const entry = {
        id: ep.id,
        path: ep.path,
        method: ep.method,
        ts: new Date().toLocaleTimeString(),
        ok: result?.ok,
        status: result?.status,
      };
      setSeedLog((prev) => [entry, ...prev].slice(0, 100));
      if (logRef.current) logRef.current.scrollTop = 0;
    },
    [sendRequest, updateEndpointField]
  );

  const seedAll = useCallback(async () => {
    setSeedingAll(true);
    const seedable = ENDPOINTS.filter((e) => e.seed);
    for (const ep of seedable) {
      await seedEndpoint(ep);
      await new Promise((r) => setTimeout(r, 200));
    }
    setSeedingAll(false);
  }, [seedEndpoint]);

  // ─── Response Display ──────────────────────────────────────────────────────

  function ResponsePanel({ epId }) {
    const state = endpointState[epId];
    const { response, loading, activeTab } = state;
    if (loading)
      return (
        <div className="text-[#8b949e] text-xs py-2">
          ⏳ Sending request…
        </div>
      );
    if (!response) return null;
    const { ok, status, statusText, data, elapsed } = response;
    const pretty =
      typeof data === "object"
        ? JSON.stringify(data, null, 2)
        : String(data);

    return (
      <div className="mt-2.5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`rounded px-2 py-[3px] text-xs font-bold border ${ok ? 'bg-[#23863622] text-[#3fb950] border-[#23863644]' : 'bg-[#f8514922] text-[#f85149] border-[#f8514944]'}`}>
            {status} {statusText}
          </span>
          <span className="text-[11px] text-[#8b949e]">{elapsed}ms</span>
        </div>
        <div className="flex gap-0 mb-2 border-b border-[#30363d]">
          {["pretty", "raw"].map((t) => (
            <button
              key={t}
              className={`px-3 py-1.5 text-[11px] cursor-pointer border-b-2 bg-transparent border-t-0 border-x-0 outline-none font-[inherit] ${activeTab === t ? 'text-[#58a6ff] border-[#58a6ff]' : 'text-[#8b949e] border-transparent'}`}
              onClick={() => updateEndpointField(epId, "activeTab", t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        {activeTab === "pretty" && (
          <pre className={`bg-[#0d1117] border border-[#30363d] rounded-md p-2.5 text-[11px] overflow-auto max-h-[300px] m-0 leading-relaxed ${ok ? 'text-[#aff5b4]' : 'text-[#ffa198]'}`}>{pretty}</pre>
        )}
        {activeTab === "raw" && (
          <pre className="bg-[#0d1117] border border-[#30363d] rounded-md p-2.5 text-[11px] overflow-auto max-h-[300px] m-0 text-[#c9d1d9] leading-relaxed">{JSON.stringify(response, null, 2)}</pre>
        )}
      </div>
    );
  }

  // ─── Endpoint Card ────────────────────────────────────────────────────────

  function EndpointCard({ ep }) {
    const state = endpointState[ep.id];
    const isOpen = !!expandedEndpoints[ep.id];
    const groupColor = getGroupColor(ep.group);

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg mb-2.5 overflow-hidden">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer select-none bg-transparent border-l-[3px]"
          style={{ borderLeftColor: groupColor }}
          onClick={() => toggleEndpoint(ep.id)}
        >
          <span className={`${METHOD_CLASSES[ep.method] || "bg-[#64748b]"} text-black rounded px-[7px] py-[2px] text-[11px] font-bold min-w-[52px] text-center shrink-0`}>
            {ep.method}
          </span>
          <span className="text-[13px] text-[#e6edf3] flex-1 font-medium">
            {ep.path}
          </span>
          <div className="flex gap-1.5 items-center">
            {ep.requiresAuth && <span className="text-[10px] bg-[#f59e0b22] text-[#f59e0b] border border-[#f59e0b44] rounded-[4px] px-1.5 py-[1px] font-semibold">AUTH</span>}
            {ep.requiresCsrf && <span className="text-[10px] bg-[#ef444422] text-[#ef4444] border border-[#ef444444] rounded-[4px] px-1.5 py-[1px] font-semibold">CSRF</span>}
            {ep.seed && <span className="text-[10px] bg-[#22c55e22] text-[#22c55e] border border-[#22c55e44] rounded-[4px] px-1.5 py-[1px] font-semibold">SEED</span>}
            {state.response && (
              <span className={`rounded px-2 py-[3px] text-xs font-bold border ${state.response.ok ? 'bg-[#23863622] text-[#3fb950] border-[#23863644]' : 'bg-[#f8514922] text-[#f85149] border-[#f8514944]'}`}>
                {state.response.status}
              </span>
            )}
            <span className="text-[#8b949e] text-xs">{isOpen ? "▲" : "▼"}</span>
          </div>
        </div>

        {isOpen && (
          <div className="px-3.5 py-3 border-t border-[#30363d]">
            <div className="text-[#8b949e] text-[11px] mb-2.5">
              {ep.description}
            </div>

            {/* Path Params */}
            {ep.pathParams.length > 0 && (
              <>
                <div className="text-[11px] text-[#58a6ff] mb-1 block uppercase">PATH PARAMS</div>
                <div className="flex gap-2 mb-2 items-start flex-wrap">
                  {ep.pathParams.map((p) => (
                    <div key={p.name} className="flex flex-col flex-1 min-w-[120px]">
                      <label className="text-[11px] text-[#8b949e] mb-1 block uppercase">{p.name}</label>
                      <input
                        className="bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] px-2.5 py-1.5 text-xs outline-none w-full"
                        placeholder={p.placeholder}
                        value={state.pathParams[p.name] || ""}
                        onChange={(e) => updatePathParam(ep.id, p.name, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#21262d] my-2.5" />
              </>
            )}

            {/* Query Params */}
            {ep.queryParams.length > 0 && (
              <>
                <div className="text-[11px] text-[#58a6ff] mb-1 block uppercase">QUERY PARAMS</div>
                <div className="flex gap-2 mb-2 items-start flex-wrap">
                  {ep.queryParams.map((p) => (
                    <div key={p.name} className="flex flex-col flex-1 min-w-[120px]">
                      <label className="text-[11px] text-[#8b949e] mb-1 block uppercase">{p.name}</label>
                      <input
                        className="bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] px-2.5 py-1.5 text-xs outline-none w-full"
                        placeholder={p.placeholder}
                        value={state.queryParams[p.name] || ""}
                        onChange={(e) => updateQueryParam(ep.id, p.name, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#21262d] my-2.5" />
              </>
            )}

            {/* Body */}
            {ep.defaultBody !== null && (
              <>
                <div className="text-[11px] text-[#58a6ff] mb-1 block uppercase">REQUEST BODY (JSON)</div>
                <textarea
                  rows={8}
                  className="bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] px-2.5 py-2 text-xs outline-none resize-y w-full box-border"
                  value={state.body}
                  onChange={(e) => {
                    updateEndpointField(ep.id, "body", e.target.value);
                    updateEndpointField(ep.id, "bodyError", null);
                  }}
                />
                {state.bodyError && <div className="text-[#f85149] text-[11px] mt-0.5">{state.bodyError}</div>}
                <div className="border-t border-[#21262d] my-2.5" />
              </>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                className="bg-[#1f6feb] border-none rounded-md text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                onClick={() => sendRequest(ep)}
                disabled={state.loading}
              >
                {state.loading ? "⏳ Sending…" : `▶ Send ${ep.method}`}
              </button>
              {ep.seed && (
                <button
                  className="bg-[#238636] border-none rounded-md text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  onClick={() => seedEndpoint(ep)}
                  disabled={state.loading}
                >
                  🌱 Seed & Send
                </button>
              )}
              {state.body && (
                <button
                  className="bg-[#6e7681] border-none rounded-md text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                  onClick={() => updateEndpointField(ep.id, "body", ep.defaultBody || "")}
                >
                  ↺ Reset Body
                </button>
              )}
              {state.response && (
                <button
                  className="bg-[#6e7681] border-none rounded-md text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                  onClick={() => updateEndpointField(ep.id, "response", null)}
                >
                  ✕ Clear Response
                </button>
              )}
            </div>

            <ResponsePanel epId={ep.id} />
          </div>
        )}
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const seedableCount = ENDPOINTS.filter((e) => e.seed).length;

  return (
    <div className="font-mono bg-[#0d1117] text-[#c9d1d9] min-h-screen p-0 m-0">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#30363d] py-4 px-6 flex items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-[#58a6ff] font-bold text-[18px] m-0">⚡ AlgoForge API Dashboard</h1>
          <p className="text-[#8b949e] text-xs m-0">{ENDPOINTS.length} endpoints across {groups.length} groups</p>
        </div>
        <div className="ml-auto flex gap-2.5 items-center flex-wrap">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#8b949e] mb-1 block uppercase">Base URL</span>
            <input
              className="bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] px-2.5 py-1.5 text-xs outline-none w-[220px]"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#8b949e] mb-1 block uppercase">CSRF Token (af_csrf cookie)</span>
            <input
              className="bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] px-2.5 py-1.5 text-xs outline-none w-[220px]"
              placeholder="Paste CSRF token here"
              value={csrfToken}
              onChange={(e) => setCsrfToken(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-70px)]">
        {/* Sidebar */}
        <div className="w-[260px] min-w-[260px] bg-[#161b22] border-r border-[#30363d] py-3 overflow-y-auto sticky top-0 max-h-[calc(100vh-70px)]">
          {groups.map((group) => {
            const color = getGroupColor(group);
            const eps = ENDPOINTS.filter((e) => e.group === group);
            const open = expandedGroups[group];
            return (
              <div key={group}>
                <div
                  className="flex items-center px-3 py-2 cursor-pointer select-none border-l-[3px] mb-[2px]"
                  style={{ borderLeftColor: color }}
                  onClick={() => toggleGroup(group)}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] flex-1" style={{ color }}>{group}</span>
                  <span className="text-[#8b949e] text-[11px]">
                    {eps.length} {open ? "▲" : "▼"}
                  </span>
                </div>
                {open &&
                  eps.map((ep) => (
                    <div
                      key={ep.id}
                      className={`flex items-center gap-1.5 py-[5px] px-3 pl-[18px] cursor-pointer text-[11px] select-none border-l-2 ${expandedEndpoints[ep.id] ? 'bg-[#21262d] border-[#58a6ff] text-[#e6edf3]' : 'bg-transparent border-transparent text-[#8b949e]'}`}
                      onClick={() => {
                        toggleEndpoint(ep.id);
                        setTimeout(() => {
                          document.getElementById(`ep-${ep.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 50);
                      }}
                    >
                      <span className={`${METHOD_CLASSES[ep.method] || "bg-[#64748b]"} text-black rounded px-1 py-[1px] text-[9px] font-bold min-w-[36px] text-center shrink-0`}>
                        {ep.method}
                      </span>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {ep.path.replace("/api", "").replace(/:[a-z]+/g, "*")}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>

        {/* Main */}
        <div className="flex-1 py-4 px-6 overflow-y-auto">
          {/* Global Config */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg py-3 px-4 mb-4 flex flex-wrap gap-3 items-start">
            <div className="flex-1 min-w-[200px]">
              <span className="text-[11px] text-[#8b949e] mb-1 block uppercase">GLOBAL HEADERS (JSON)</span>
              <textarea
                rows={3}
                className="bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] px-2.5 py-2 text-xs outline-none resize-y w-full box-border"
                value={globalHeaders}
                onChange={(e) => {
                  setGlobalHeaders(e.target.value);
                  setGlobalHeadersError(null);
                }}
              />
              {globalHeadersError && <div className="text-[#f85149] text-[11px] mt-0.5">{globalHeadersError}</div>}
            </div>
          </div>

          {/* Seed Panel */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg py-3 px-3.5 mb-4">
            <div className="flex items-center gap-3 mb-2.5">
              <span className="text-[13px] font-bold text-[#3fb950]">🌱 Data Seeding</span>
              <span className="text-[11px] text-[#8b949e]">
                {seedableCount} endpoints support seeding
              </span>
              <button
                className="bg-[#238636] border-none rounded-md text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer ml-auto disabled:opacity-50"
                onClick={seedAll}
                disabled={seedingAll}
              >
                {seedingAll ? "⏳ Seeding all…" : `🌱 Seed All (${seedableCount})`}
              </button>
            </div>
            {seedLog.length > 0 && (
              <>
                <div className="text-[11px] text-[#8b949e] mb-1.5 block uppercase">SEED LOG</div>
                <div
                  ref={logRef}
                  className="max-h-[140px] overflow-y-auto flex flex-col gap-0.5"
                >
                  {seedLog.map((entry, i) => (
                    <div key={i} className={`px-2 py-1 rounded-[4px] text-[11px] mb-[3px] border-l-[3px] ${entry.ok ? 'bg-[#23863611] border-[#238636]' : 'bg-[#f8514911] border-[#f85149]'}`}>
                      <span className={entry.ok ? "text-[#3fb950]" : "text-[#f85149]"}>
                        {entry.ok ? "✓" : "✗"}
                      </span>{" "}
                      <span className="text-[#8b949e]">{entry.ts}</span>{" "}
                      <span className={`${METHOD_CLASSES[entry.method] || "bg-[#64748b]"} text-black rounded px-[7px] py-[2px] text-[11px] font-bold min-w-[52px] text-center shrink-0`}>{entry.method}</span>{" "}
                      <span>{entry.path}</span>{" "}
                      <span className={entry.ok ? "text-[#3fb950]" : "text-[#f85149]"}>
                        HTTP {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Endpoint Groups */}
          {groups.map((group) => {
            const eps = ENDPOINTS.filter((e) => e.group === group);
            const color = getGroupColor(group);
            return (
              <div key={group} className="mb-5">
                <div
                  className="flex items-center gap-2.5 mb-2.5 pb-1.5 cursor-pointer select-none border-b-2"
                  style={{ borderBottomColor: color }}
                  onClick={() => toggleGroup(group)}
                >
                  <span className="text-[13px] font-bold" style={{ color }}>
                    {group.toUpperCase()}
                  </span>
                  <span
                    className="rounded-full px-2 py-[1px] text-[11px] font-bold"
                    style={{ backgroundColor: color + "22", color }}
                  >
                    {eps.length}
                  </span>
                  <span className="text-[#8b949e] text-[11px] ml-auto">
                    {expandedGroups[group] ? "▲ collapse" : "▼ expand"}
                  </span>
                </div>
                {expandedGroups[group] &&
                  eps.map((ep) => (
                    <div key={ep.id} id={`ep-${ep.id}`}>
                      <EndpointCard ep={ep} />
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}