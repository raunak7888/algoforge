## Phase 0 — Foundation (Tracer Bullet Skeleton)

### Goal

End-to-end working pipeline with minimal logic.

### Backend

* Node.js (Express/Fastify)
* Prisma setup
* PostgreSQL connection
* Basic routes:

  * `/auth`
  * `/analysis`

### Frontend

* Next.js app
* Pages:

  * Login
  * Code input (textarea + submit)

### Database (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
}

model Analysis {
  id        String   @id @default(uuid())
  code      String
  language  String
  result    Json
  createdAt DateTime @default(now())
}
```

### AI Layer

* Stub response (hardcoded JSON)

### Output

* Paste code → get fake analysis

---

## Phase 1 — Authentication & Persistence

### Goal

Make system real with user identity.

### Backend

* Google OAuth2
* JWT/session handling
* Protected routes

### Frontend

* Google login button
* Session persistence

### Database

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  image     String?
  analyses  Analysis[]
}
```

### Output

* User logs in
* Analyses saved per user

---

## Phase 2 — AI Code Analysis (Core Engine)

### Goal

Deliver actual product value.

### Backend

* AI service module
* Prompt → LLM → structured JSON
* Validation layer

### Data Contract

```ts
type AnalysisResult = {
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  antiPatterns: string[];
  optimizedCode: string;
}
```

### Frontend

* Display:

  * Complexity
  * Explanation
  * Refactored code

### Output

* Real AI-powered analysis

---

## Phase 3 — Dashboard & History

### Goal

Improve usability and retention.

### Backend

* GET `/analyses`
* Pagination

### Frontend

* Dashboard page
* List + reopen analyses

### Database

```prisma
@@index([userId])
@@index([createdAt])
```

### Output

* User can revisit past work

---

## Phase 4 — Shareable Reports

### Goal

Enable distribution and growth.

### Backend

* Public endpoint `/share/:id`

### Database

```prisma
model Analysis {
  shareId  String? @unique
  isPublic Boolean @default(false)
}
```

### Frontend

* Share button
* Public report page

### Output

* Shareable analysis links

---

## Phase 5 — Algorithm Visualizer

### Goal

Introduce interactive learning.

### Backend

* Minimal (optional precomputed steps)

### Frontend

* Visualization engine (Canvas/SVG)
* Step controller

### Data Model

```ts
type Step = {
  state: number[];
  highlights: number[];
}
```

### Features

* Sorting: Bubble (start)
* Graph: BFS (start)

### Output

* Step-by-step animation

---

## Phase 6 — Battle Mode

### Goal

Add comparison capability.

### Backend

* Comparison service (same input)

### Frontend

* Dual panels
* Step counter
* Winner summary

### Output

* Side-by-side algorithm race

---

## Phase 7 — AI Optimization Coach (Chat)

### Goal

Context-aware interaction.

### Backend

* Chat memory per analysis
* Context injection into prompts

### Database

```prisma
model ChatMessage {
  id         String   @id @default(uuid())
  analysisId String
  role       String
  content    String
  createdAt  DateTime @default(now())
}
```

### Frontend

* Chat UI
* Follow-up queries

### Output

* Conversational AI coaching

---

## Phase 8 — Fun & Engagement Layer

### Goal

Increase retention and differentiation.

### Backend

* Flags for modes (fun/pro)

### Frontend

* Mascot reactions
* Complexity speedometer
* Report card (A–F)
* Roast mode toggle

### Output

* Gamified experience

---

## Phase 9 — Pro Mode

### Goal

Serve advanced users.

### Backend

* Mode flag support

### Frontend

* Toggle:

  * Fun Mode
  * Pro Mode

### Behavior

* Hide mascot
* Use technical language
* Minimal UI

### Output

* Dual UX experience

---

# Final System View

## Backend

* Modular services:

  * Auth
  * Analysis
  * AI
  * Share
  * Chat

## Frontend

* Feature-driven structure:

  * Analysis
  * Dashboard
  * Visualizer
  * Battle
  * Chat

## Database

* PostgreSQL + Prisma
* Indexed for:

  * userId
  * createdAt
  * shareId

---

# Key Tracer Bullet Property

Each phase:

* Works end-to-end
* Is deployable
* Adds depth (not breadth explosion)
