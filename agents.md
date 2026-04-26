# AlgoForge - TypeScript Architecture for AI Agents

## Project Overview
AlgoForge is a platform for automated code analysis, optimization, and complexity estimation. It uses AI to analyze code snippets, provide time/space complexity estimates, identify bottlenecks, and suggest optimizations.

### High-Level Architecture
- **Frontend**: Next.js (App Router) with Tailwind CSS, Framer Motion, and GSAP.
- **Backend**: Node.js with Express, using Prisma ORM.
- **Database**: PostgreSQL (via Prisma).
- **AI**: Gemini API (Google GenAI) and OpenRouter for code analysis.

## Folder Structure Summary
- `apps/api`: Backend Express application.
- `apps/web`: Frontend Next.js application.
- `packages/db`: Prisma schema and database client.
- `packages/analysis`: Shared types and Zod schemas for analysis data.

## TypeScript File Documentation

### apps/api/src/app.ts
Main Express application entry point. Mounts middleware and routers.
Exports:
- `app`

### apps/api/src/server.ts
Starts the Express server.

### apps/api/src/routes/analysis.ts
Handles analysis-related endpoints including creation and sharing.
Endpoints:
- `GET /api/analyses`: List user analyses.
- `GET /api/analyses/:id`: Get analysis by ID.
- `POST /api/analysis`: Create new analysis.
- `POST /api/analysis/:id/share`: Generate a shareable link.

### apps/api/src/routes/share.ts
Handles public access to shared analyses.
Endpoints:
- `GET /api/share/:shareId`: Fetch a public analysis report.

### apps/api/src/controllers/analysis.controller.ts
Controller logic for analysis operations, wrapping service calls in `asyncHandler`.
Exports:
- `analysisController` (instance of `AnalysisController`)

### apps/api/src/services/analysis.service.ts
Core business logic for analyses, database interactions, and AI integration.
Exports:
- `analysisService` (instance of `AnalysisService`)

### apps/api/src/services/ai.service.ts
Handles communication with AI providers (Gemini/OpenRouter).
Exports:
- `aiService` (instance of `AiService`)

### apps/web/src/app/page.tsx
Main workspace page where users input code for analysis.

### apps/web/src/app/analysis/[id]/page.tsx
Detail page for viewing a specific stored analysis.

### apps/web/src/app/share/[shareId]/page.tsx
Public read-only page for shared analysis reports.

### apps/web/src/components/AnalysisResult.tsx
Renders the full analysis report, including metrics, bottlenecks, and optimized code.

### apps/web/src/lib/analyses.ts
Frontend API client for analysis-related requests.

## Data Flow
1. **Frontend**: User submits code via `AnalysisForm`.
2. **API**: `POST /api/analysis` validates input and calls `analysisService`.
3. **AI**: `aiService` sends code to LLM (e.g., Gemini) with a structured prompt.
4. **DB**: `analysisService` stores the structured AI response in PostgreSQL.
5. **Response**: API returns the serialized analysis record to the frontend.

## Key Systems

### Auth Flow
Uses Google OAuth and custom JWT-based sessions. `requireAuth` middleware protects private routes.

### Analysis Pipeline
Code -> AI Prompt -> JSON Parsing -> Prisma Storage -> Result Display.

### Sharing System
Users can toggle `isPublic` on an analysis. A unique `nanoid` is generated as `shareId`. Public access is granted via `/api/share/:shareId` without authentication.

## Conventions
- **Naming**: Controllers use `.controller.ts`, services use `.service.ts`, routes use plural for lists and singular for creations where appropriate.
- **API Structure**: Standard RESTful patterns.
- **State Management**: Zustand for client-side state (e.g., `analysis-history`).

## Critical Rules for Future AI
- **Never expose sensitive data**: Always use the sanitization layer in `analysisService` for public responses.
- **Always sanitize responses**: Validate all external inputs using Zod.
- **Maintain separation of concerns**: Keep business logic in services, HTTP handling in controllers, and routing in route files.
- **Security**: Validate ownership of resources before allowing modifications (like sharing).
