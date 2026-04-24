# AlgoForge ⚡

Algorithm complexity analyzer — tracer bullet monorepo.

## Stack

- **Frontend** — Next.js 14 + TypeScript (`apps/web`, port 3000)
- **Backend** — Express + TypeScript (`apps/api`, port 4000)
- **Database** — PostgreSQL via Docker
- **ORM** — Prisma (`packages/db`)
- **Monorepo** — pnpm workspaces

---

## Prerequisites

- Node.js v18+
- pnpm (`npm install -g pnpm`)
- Docker + Docker Compose

---

## One-Time Setup

```bash
# 1. Clone / enter the project
cd algoforge

# 2. Run the setup script (starts DB, installs deps, migrates schema)
bash setup.sh
```

That's it. The script:
1. Starts PostgreSQL in Docker
2. Installs all workspace deps via pnpm
3. Generates Prisma client
4. Runs DB migration (creates tables)

---

## Run the Project

```bash
pnpm dev
```

Opens:
- Frontend → http://localhost:3000
- Backend  → http://localhost:4000
- Health   → http://localhost:4000/health

---

## Project Structure

```
algoforge/
├── apps/
│   ├── api/                  # Express backend
│   │   └── src/
│   │       ├── routes/
│   │       │   └── analysis.ts   # POST /analysis, GET /analysis
│   │       ├── app.ts            # Express app + middleware
│   │       └── server.ts         # HTTP server entry
│   └── web/                  # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   └── page.tsx      # Main page
│           └── components/
│               ├── AnalysisForm.tsx    # Code input + language selector
│               └── AnalysisResult.tsx # Result display
├── packages/
│   └── db/                   # Prisma ORM
│       ├── prisma/
│       │   └── schema.prisma     # User + Analysis models
│       └── src/
│           └── index.ts          # PrismaClient singleton
├── docker-compose.yml        # PostgreSQL
├── package.json              # Root workspace
├── pnpm-workspace.yaml
└── setup.sh                  # One-time setup script
```

---

## API Reference

### POST /analysis

**Request:**
```json
{
  "code": "def binary_search(arr, x):\n    ...",
  "language": "python"
}
```

**Response (201):**
```json
{
  "id": "clxyz...",
  "language": "python",
  "complexity": "O(n log n)",
  "suggestion": "Consider using list comprehensions for better performance.",
  "timeEstimate": "42ms",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Supported languages:** python, javascript, typescript, java, cpp, go, rust

### GET /analysis

Returns last 10 analyses from the database. Used to verify persistence.

---

## DB Management

```bash
# Open Prisma Studio (DB GUI)
pnpm db:studio

# Re-run migrations (after schema changes)
pnpm db:migrate

# Regenerate Prisma client (after schema changes)
pnpm db:generate
```

---

## End-to-End Test (curl)

```bash
curl -X POST http://localhost:4000/analysis \
  -H "Content-Type: application/json" \
  -d '{"code": "for i in range(n):\n  for j in range(n):\n    print(i,j)", "language": "python"}'
```

---

## Verify DB Persistence

```bash
curl http://localhost:4000/analysis
```

Should return the stored record.
