## 🔴 PROBLEM REPORT

---

### Problem #1: Algorithm Creation Silently Discards Complexity, DisplayCode, ForgeCode, and Tags
- **Type:** Data Flow / Backend / API
- **Severity:** Critical
- **Problem:** `algorithmService.createAlgorithm()` only persists `slug`, `name`, `description`, `categoryId`, `difficulty`, and `isPublished`. The `Complexity`, `DisplayCode`, `AlgorithmForge`, and `AlgorithmTag` related models are never created. The `CreateAlgorithmSchema` doesn't even include these fields, so they cannot be submitted through the API at all.
- **Why it matters:** Every algorithm created through the API is permanently incomplete. The visualization system (`getAlgorithmExecution`) will always return 404 for any newly created algorithm because `forge` will never exist. The `/viz` page shows "No complexity data" for all algorithms.
- **Root Cause:** The `createAlgorithm` service method and its Zod schema were built without fields for the nested relations. There are no API endpoints or service methods to attach `Complexity`, `DisplayCode`, or `AlgorithmForge` after creation either.

---

### Problem #2: `getAlgorithmExecution` Always Fails for Real Algorithms
- **Type:** Backend / Data Flow
- **Severity:** Critical
- **Problem:** `algorithmService.getAlgorithmExecution()` queries `algorithm.forge` which requires an `AlgorithmForge` record. Since creation never creates this record (Problem #1), calling `GET /api/algorithms/:id/visualize` will always throw `AppError.notFound("Algorithm execution data not found.")` for any algorithm created via the API.
- **Why it matters:** The entire visualization feature — the core product offering — is non-functional end-to-end through the public API.
- **Root Cause:** No write path exists to populate `AlgorithmForge`, but the read path assumes it exists.

---

### Problem #3: `updateAlgorithm` Cannot Update Nested Relations
- **Type:** Backend / API
- **Severity:** High
- **Problem:** `algorithmService.updateAlgorithm()` only updates top-level scalar fields. There is no mechanism to update `Complexity`, `DisplayCode`, `AlgorithmForge`, or `Tags` via `PATCH /api/algorithms/:id`.
- **Why it matters:** Even if complexity or forge data were somehow inserted directly into the database, there is no API path to update it. The system has no complete CRUD for algorithms.
- **Root Cause:** `UpdateAlgorithmSchema` mirrors the same incomplete field set as `CreateAlgorithmSchema`.

---

### Problem #4: Route Order Conflict — `/slug/:slug` Is Unreachable
- **Type:** Backend / API / Bug
- **Severity:** High
- **Problem:** In `routes/algorithm.ts`, the routes are registered in this order: `GET /:id`, then `GET /:id/visualize`, then `GET /slug/:slug`. Because Express matches routes sequentially, `GET /slug/:slug` will be captured by `GET /:id` with `id = "slug"`, causing a lookup by `id = "slug"` which returns 404 or a wrong result.
- **Why it matters:** `getAlgorithmBySlug` is completely inaccessible through the API. Any frontend or client using `/api/algorithms/slug/bubble-sort` gets a wrong response.
- **Root Cause:** Static path segments must be registered before dynamic ones in Express. `GET /slug/:slug` must come before `GET /:id`.

---

### Problem #5: `shareAnalysis` Uses `as any` to Bypass TypeScript — Indicates Schema Mismatch
- **Type:** Data Flow / DB / Bug
- **Severity:** High
- **Problem:** In `analysisService.shareAnalysis()` and `getPublicAnalysis()`, multiple Prisma calls are cast with `as any` (`prisma.analysis.update as any`, `prisma.analysis.findUnique as any`) to access `shareId` and `isPublic`. This means the Prisma-generated client does not know about these fields, which means the database migration has not been run or the Prisma client has not been regenerated after the schema was updated.
- **Why it matters:** If the migration wasn't run, `shareId` and `isPublic` columns don't exist in the database and any share operation will throw a runtime database error. The `as any` casts suppress the TypeScript error but allow crashes at runtime.
- **Root Cause:** Prisma schema was updated but the `prisma generate` / `prisma migrate` cycle was not completed and committed, leaving the generated client out of sync.

---

### Problem #6: `getPublicAnalysis` Checks `isPublic` After Fetching — No DB-Level Filter
- **Type:** Backend / Security / Data Flow
- **Severity:** High
- **Problem:** In `analysisService.getPublicAnalysis()`, the record is fetched first (returning all fields including `code` and `result`), and then `isPublic` is checked in application code. If the `isPublic` check were accidentally removed or bypassed, private data would be returned.
- **Why it matters:** The full analysis payload including original `code` is fetched before authorization is confirmed. The more secure pattern is to include `isPublic: true` in the `where` clause.
- **Root Cause:** Authorization check is done post-fetch rather than at query time.

---

### Problem #7: CSRF Middleware Applied to Token Refresh on Page Load
- **Type:** Security / API Design
- **Severity:** High
- **Problem:** `POST /api/auth/refresh` requires `requireCsrf`, but the CSRF token (`af_csrf`) is set when auth cookies are set. On first page load with a valid refresh token but an expired access token, if the CSRF cookie hasn't been read by the client yet, the refresh will fail with 403. The `apiFetch` in `api.ts` only reads the CSRF cookie client-side at request time, but the refresh flow is also triggered by `apiFetch` automatically on 401. This creates a potential deadlock: access token expired → 401 → try refresh → CSRF cookie may not be available in SSR/server context.
- **Why it matters:** Users can be silently logged out when their access token expires if the CSRF cookie is not present, even with a valid refresh token.
- **Root Cause:** CSRF protection requires a readable cookie, but the refresh endpoint is called as a recovery mechanism where that cookie's availability cannot be guaranteed.

---

### Problem #8: `AlgorithmListItemSchema` Marks `complexity` as Nullable, But Query Always Joins It
- **Type:** Data Flow / DB
- **Severity:** Medium
- **Problem:** `listAlgorithms` selects the `complexity` relation, which is a nullable one-to-one relation in Prisma. If no `Complexity` record exists for an algorithm, Prisma returns `null` for that field. The schema handles this with `.nullable()`. However, the `AlgorithmDetailSchema` also marks `displayCode` as `.nullable()` and `tags` as a required array — but if `tags` is empty (no `AlgorithmTag` records), the mapping `algorithm.tags.map(t => t.tag)` returns `[]`, which is valid, but the join always fires. The real issue is that all related data will be `null` for every API-created algorithm (Problem #1), making the API responses consistently incomplete.
- **Why it matters:** Every response from `GET /api/algorithms` and `GET /api/algorithms/:id` has `complexity: null` and `displayCode: null` for all real-world records.
- **Root Cause:** Write paths never populate these relations.

---

### Problem #9: `createAnalysis` Stores `complexity` as `timeWorst` — Misleading Field Name
- **Type:** Data Flow / DB
- **Severity:** Medium
- **Problem:** In `analysisService.createAnalysis()`, the `complexity` column in the `Analysis` table is populated with `analysisResult.complexity.time.worst`. The column is named `complexity` but stores only the worst-case time complexity string. The history list then shows this field under a "complexity" label, which is misleading and incomplete.
- **Why it matters:** Users see a truncated representation of complexity in the history list. The field name implies a full complexity record but stores only one dimension of it.
- **Root Cause:** The `Analysis` schema has a single `String? complexity` column where a structured value or separate columns would be more appropriate.

---

### Problem #10: `storeGeneration` and `pageRequests` / `detailRequests` Are Module-Level Singletons
- **Type:** Bug / Practice
- **Severity:** Medium
- **Problem:** In `analysis-history.ts`, `storeGeneration`, `pageRequests`, and `detailRequests` are declared at module scope outside the Zustand store. In a Next.js app with React Strict Mode enabled (which is set in `next.config.ts`), components mount twice in development. More critically, these module-level variables are shared across all instances and are never reset properly when navigating between routes in a single-page app context, potentially causing stale request guards.
- **Why it matters:** A `reset()` call clears the Zustand state but the module-level `pageRequests` and `detailRequests` Maps are also cleared, which is correct — but `storeGeneration` increment is the only guard against stale responses. If two store instances coexist (e.g., during SSR hydration mismatches), they share the same generation counter.
- **Root Cause:** Mutable module-level state used as a substitute for proper request cancellation (e.g., AbortController).

---

### Problem #11: `logout` in `AuthContext` Does Not Send CSRF Token
- **Type:** Bug / Security
- **Severity:** Medium
- **Problem:** In `context/Authcontext.tsx`, the `logout` function calls `apiFetch("/api/auth/logout", { method: "POST" })`. The `apiFetch` function reads the CSRF token from `getCookie("af_csrf")` and sets it only if present. However, the `logout` route requires `requireCsrf`. If for any reason the CSRF cookie has expired or is missing (e.g., after a browser restart or cookie being cleared), logout will fail silently with a 403 — `setUser(null)` and `resetAnalysisHistory()` still execute, creating a state where the UI thinks the user is logged out but the server session remains active.
- **Why it matters:** Active server sessions are not revoked. Refresh tokens remain valid. If the device is shared, the session can be reused.
- **Root Cause:** The logout handler swallows errors (`catch (error) => console.error`) and clears local state regardless of server response.

---

### Problem #12: `hydrateSession` in `AuthContext` Does Not Call `refreshSession` on 401
- **Type:** Bug / Data Flow
- **Severity:** Medium
- **Problem:** In `AuthProvider`, `hydrateSession` calls `GET /api/auth/me` which uses `apiFetch`. The `apiFetch` function does handle 401 by attempting a token refresh — but `GET /api/auth/me` in the controller uses `getToken()` and calls `userService.getUserByToken()` which returns `null` (not a 401) when the token is expired or missing. So `response.ok` is `true` and `data.user` is `null`, bypassing the refresh flow entirely.
- **Why it matters:** On page load with an expired access token but valid refresh token, the user is shown as logged out instead of being silently refreshed. The session is lost unnecessarily.
- **Root Cause:** `GET /api/auth/me` returns `200 { user: null }` instead of `401` when unauthenticated, preventing the automatic refresh mechanism in `apiFetch` from triggering.

---

### Problem #13: `GET /api/auth/me` Verifies Session Validity But `GET /api/auth/session` Also Exists — Redundant Endpoints
- **Type:** API Design / Practice
- **Severity:** Low
- **Problem:** There are two endpoints for retrieving the current user: `GET /api/auth/me` (which does its own token verification + session DB check) and `GET /api/auth/session` (which uses `requireAuth` middleware). Both return the current user. The `AuthContext` uses `/me` while a separate `AuthProvider` component (`components/AuthProvider.tsx`) references a `useAuthStore` that's separate from `context/Authcontext.tsx`. The two auth stores (`useAuthStore` and `AuthContext`) coexist but are never synchronized.
- **Why it matters:** There are two parallel, disconnected auth state systems. `components/AuthProvider.tsx` is imported nowhere visible in `app/layout.tsx` (which uses `context/Authcontext.tsx`'s `AuthProvider`), making `useAuthStore` and `components/AuthProvider.tsx` dead code.
- **Root Cause:** Auth was implemented twice with different approaches and the older one was never removed.

---

### Problem #14: `console.log` Statements Left in Production Controller
- **Type:** Practice / Security
- **Severity:** Low
- **Problem:** `algorithmController.create` contains `console.log(req.body)` and `console.log("___...")` that log the full request body and debug markers. The validation function `parseCreateAlgorithm` also has `console.log(result)`.
- **Why it matters:** In production, this logs user-submitted data to stdout. Depending on log aggregation, this could expose data in logging systems and creates noise that obscures real errors.
- **Root Cause:** Debug statements were not removed before code was committed.

---

### Problem #15: `getviz/page.tsx` Exposes Admin Seeding UI Without Auth Check
- **Type:** Security / Backend
- **Severity:** Medium
- **Problem:** The `/getviz` page is publicly accessible with no authentication check on the frontend. It allows anyone to trigger category and algorithm creation by hitting the API directly. While the API does enforce `requireAuth` + `requireRoles(Role.ADMIN)` + `requireCsrf`, an unauthenticated user who visits `/getviz` sees the full seeding UI and attempts will fail silently (the error is caught and displayed as a log entry).
- **Why it matters:** The page leaks the internal seeding structure, slug names, forge code snippets, and API endpoint patterns to any visitor. This is unnecessary information disclosure.
- **Root Cause:** Admin tooling was built as a public Next.js page without route protection.

---

### Problem #16: `AlgorithmForge.forgeCode` Stored as `Json` But Schema Expects Structured `ForgeCode` Object
- **Type:** DB / Data Flow
- **Severity:** Medium
- **Problem:** The Prisma schema stores `forgeCode`, `inputSchema`, and `guardRanges` as `Json` type. The `AlgorithmExecutionSchema` in `packages/forge/src/schemas.ts` parses these fields with strict Zod schemas (`ForgeCodeSchema`, `GuardRangesSchema`). There is no validation at write time — anything can be stored in these Json columns. The strict Zod parse only happens at read time in `getAlgorithmExecution`.
- **Why it matters:** Malformed data stored in `forgeCode` or `guardRanges` will cause `getAlgorithmExecution` to throw a Zod validation error at read time, not write time. This is a silent corruption risk.
- **Root Cause:** Write-time validation is absent because the API never exposes a write path for these fields (Problem #1).

---

## ⚠️ SYSTEM SUMMARY

- **Total Problems:** 16
- **Critical Issues:** 2
- **High Impact Areas:**
  - **Data Flow** — Algorithm creation discards all meaningful data (complexity, forge code, display code, tags); the core write path is fundamentally incomplete
  - **API Layer** — Route ordering makes slug lookup unreachable; no endpoints exist to write nested algorithm data; redundant and dead auth endpoints
  - **Database** — Prisma client out of sync with schema (`shareId`/`isPublic` cast with `as any`); Json columns lack write-time validation
  - **Auth System** — Two parallel disconnected auth stores; logout silent failure leaves server sessions alive; session hydration bypasses refresh mechanism
  - **Visualization Feature** — End-to-end non-functional through the public API due to missing write paths for `AlgorithmForge`