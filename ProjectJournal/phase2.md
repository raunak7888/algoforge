# 🚀 Phase 2 Plan — AI Code Analysis (Core Engine)

## Direct Answer

Your goal is to build a **reliable AI pipeline** that converts code → structured analysis → stored result → UI display.

---

# 🧠 Explanation

Right now:

```txt
User → Submit Code → Dummy Response
```

After Phase 2:

```txt
User → Submit Code → AI Engine → Structured JSON → Validate → Store → Render
```

This is your **core value layer**.

---

# 🧩 Execution Plan (Step-by-Step)

## 1. Backend — AI Service Layer

### What to build

Create a **dedicated module**:

```txt
/services/ai.service.ts
```

### Responsibilities:

* Accept code + language
* Build prompt
* Call LLM
* Return structured result

👉 Keep this isolated (very important for scaling later)

---

## 2. Prompt Engineering (Critical)

### You must enforce:

* Strict JSON output
* No extra text
* Deterministic format

### Your prompt should:

* Define schema clearly
* Include example output
* Say: `"Return ONLY valid JSON"`

---

## 3. Data Contract (Lock This)

```ts
type AnalysisResult = {
  summary: string;

  complexity: {
    time: {
      best: string;
      average: string;
      worst: string;
    };
    space: string;
  };

  breakdown: {
    approach: string;
    steps: string[];
  };

  bottlenecks: {
    issue: string;
    impact: string;
    location?: string;
  }[];

  antiPatterns: string[];

  improvements: {
    suggestion: string;
    expectedImpact: string;
  }[];

  optimizedCode: string;

  comparison?: {
    originalVsOptimized: string;
    improvementSummary: string;
  };

  edgeCases: string[];

  readabilityScore?: number; // 1–10

  tags?: string[]; // e.g., ["DP", "Brute Force", "Greedy"]
};
```

👉 This becomes your **system contract**

---

## 4. LLM Integration

### Backend flow:

```txt
POST /analysis
    ↓
Validate input
    ↓
Call AI service
    ↓
Get raw response
    ↓
Parse JSON
    ↓
Validate schema
    ↓
Store in DB
    ↓
Return response
```

---

## 5. Validation Layer (Non-Negotiable)

AI is unreliable — assume it WILL break.

### Validate:

* JSON parse success
* Required fields exist
* Correct types

### If fails:

* Retry (optional)
* OR return controlled error

---

## 6. Database Update

You already have:

```prisma
result Json
```

### Now:

* Store actual AI output
* Keep it structured (no string blobs)

---

## 7. Frontend Upgrade

### Replace dummy UI with:

* Time Complexity
* Space Complexity
* Explanation
* Anti-patterns (list)
* Optimized Code (formatted)

---

## 8. UX Layer (Small but Critical)

* Loading state (AI latency)
* Disable submit while processing
* Error UI (fail gracefully)

---

# ⚠️ Critical Rules (Don’t Ignore)

### ❌ Don’t:

* Trust AI output blindly
* Skip validation
* Mix AI logic inside routes
* Allow free-form responses

### ✅ Do:

* Enforce schema
* Keep AI isolated
* Log responses (debugging)

---

# 🔥 End-to-End Flow (Final System)

```txt
Frontend
  ↓
API /analysis
  ↓
AI Service
  ↓
LLM (OpenAI)
  ↓
Structured JSON
  ↓
Validation Layer
  ↓
PostgreSQL (JSONB)
  ↓
Frontend Render
```

---

# ✅ Completion Criteria (Definition of Done)

You are DONE when:

* ✔ Real AI response (no stub)
* ✔ Strict JSON output
* ✔ Validation layer implemented
* ✔ Stored in PostgreSQL
* ✔ UI renders cleanly
* ✔ End-to-end works reliably

---

# 💡 Better Insight

This phase is NOT about AI.

It is about building a:

```txt
Controlled AI System (deterministic wrapper around a non-deterministic model)
```

If you do this well → everything else (chat, optimization coach, etc.) becomes easy.
