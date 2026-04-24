## Phase 1 — Authentication & Persistence

## 1. Backend — Authentication System

### Setup OAuth (Google)

* Create Google OAuth credentials (Client ID + Secret)
* Configure redirect URLs (dev + prod)
* Integrate OAuth flow into backend

### User Identity Handling

* On successful login:

  * Extract user info (email, name, profile image)
  * Check if user exists in DB
  * If not → create new user
  * If yes → fetch existing user

### Session / Token System

* Choose one:

  * JWT (stateless) ✅ recommended
  * OR session-based auth

* Implement:

  * Token generation on login
  * Token verification middleware
  * Token expiration handling

### Protected Routes

* Secure routes like:

  * `/analysis`
  * future `/analyses`
* Add middleware:

  * Reject unauthenticated requests
  * Attach user info to request

---

## 2. Backend — Database Updates

### Update Prisma Schema

* Extend `User` model:

  * Add `name`
  * Add `image`
  * Add relation to `Analysis`

### Relation Setup

* Link:

  * One user → many analyses

### Migration

* Run Prisma migration
* Verify schema sync with DB

---

## 3. Backend — Analysis Ownership

### Modify Analysis Flow

* When analysis is created:

  * Attach `userId`
* Ensure:

  * Each analysis belongs to a user

### Data Integrity

* Prevent:

  * Anonymous analysis storage (unless intentionally allowed)

---

## 4. Frontend — Authentication UI

### Google Login

* Add "Continue with Google" button
* Trigger OAuth flow

### Auth State Handling

* Store user session:

  * Cookie / local storage (depending on approach)
* Maintain login state across refresh

### Logout

* Add logout functionality
* Clear session/token

---

## 5. Frontend — Protected Experience

### Route Protection

* Restrict pages:

  * Code analysis page
  * Future dashboard
* Redirect unauthenticated users → login

### Session Persistence

* On app load:

  * Check if user is logged in
  * Restore session

## 6. Frontend ↔ Backend Integration

### Auth Flow Wiring

* Frontend sends auth request
* Backend returns token/session
* Frontend stores and uses it for API calls

### Attach Auth Headers

* Include token in:

  * `/analysis` requests
  * future protected endpoints

## 7. Data Persistence (Core Outcome)

### Save Analyses Per User

* On every analysis:

  * Save in DB with `userId`

### Verify End-to-End Flow

* Login → submit code → analysis stored → linked to user

## 8. Testing (Critical)

### Functional Testing

* Login works
* Token is generated
* Protected routes reject unauthorized users
* Analyses are saved correctly

### Edge Testing

* Expired token
* Invalid token
* Duplicate users (same email)

## Final Output of Phase 1

You should have:

* Working Google login
* Persistent user sessions
* Protected backend routes
* Analyses tied to users in database
* Full end-to-end authenticated flow


## Important Reality Check

If you skip proper token validation or user linking here,
**everything in later phases (dashboard, sharing, chat)** will break or become messy.

## Better Insight

Do **NOT over-engineer auth**:
* No roles/permissions yet
* No refresh token complexity unless needed
* Keep it minimal and reliable
