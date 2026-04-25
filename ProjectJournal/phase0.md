## 1. Prepare Environment

* Install Node.js (v18+)
* Install PostgreSQL (or run via Docker)
* Ensure DB is running
* Create a database (e.g., `algoforge`)

---

## 2. Initialize Project

* Create root project folder
* Initialize npm project
* Decide package manager (npm/pnpm — stick to one)

---

## 3. Create Monorepo Structure

* Create:

  * `apps/api` (backend)
  * `apps/web` (frontend)
  * `packages/db` (Prisma)

* Enable workspaces in root package.json

---

## 4. Setup Backend

* Initialize Node project inside `apps/api`

* Install:

  * Express (or Fastify)
  * CORS

* Setup TypeScript

* Create basic folder structure:

  * routes
  * app entry
  * server entry

* Configure:

  * JSON parsing
  * CORS

---

## 5. Setup Prisma + Database

* Initialize Prisma inside `packages/db`
* Configure PostgreSQL connection via `.env`
* Define schema:

  * `User`
  * `Analysis`
* Run migration
* Generate Prisma client

---

## 6. Connect Backend to Database

* Import Prisma client into backend
* Verify backend can:

  * Connect to DB
  * Perform a simple write (test manually)

---

## 7. Build Core API Route (CRITICAL)

* Create `/analysis` endpoint

* Accept:

  * code
  * language

* Implement:

  * Basic validation (non-empty)
  * Fake AI response (hardcoded)

* Store:

  * code
  * language
  * result (JSON) into DB

* Return response

---

## 8. Setup Frontend

* Initialize Next.js app in `apps/web`
* Remove unnecessary boilerplate
* Keep it minimal

---

## 9. Build Minimal UI

* Add:

  * Code input (textarea)
  * Language selector (optional)
  * Submit button
  * Result display area

---

## 10. Connect Frontend → Backend

* Call backend `/analysis` API
* Send JSON payload
* Handle response
* Display output

---

## 11. Setup Root Dev Workflow

* Add script to run:

  * Backend
  * Frontend simultaneously

* Ensure both start with one command

---

## 12. End-to-End Validation (MOST IMPORTANT)

Manually verify:

* Open frontend
* Enter code
* Submit request
* Backend receives it
* DB stores it
* Response returns
* UI displays result

---

## 13. Debug Until Stable

Fix any of:

* CORS issues
* DB connection errors
* API failures
* JSON parsing issues
* Port conflicts

---

## 14. Performance Check (Basic)

* Ensure response time < 2 seconds
* No crashes on repeated requests

---

## 15. Definition of Done (STRICT)

You are done ONLY if:

* Full flow works without manual fixes
* No crashes
* DB persistence works
* One command starts everything
* You can demo it in <30 seconds

---

## 16. What NOT to Do (Critical Discipline)

Do NOT add:

* Authentication
* Real AI integration
* Dashboard/history
* Complex UI
* Validation libraries (keep minimal)

If you do → you're breaking tracer bullet.
