import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { securityHeaders } from "./middleware/security-headers";
import { generalRateLimiter } from "./middleware/rate-limit";

// ── Routers ───────────────────────────────────────────────────────────────────
import adminRouter              from "./routes/admin";
import algorithmRouter          from "./routes/algorithm";
import analysisRouter           from "./routes/analysis";
import authRouter               from "./routes/auth";
import categoryRouter           from "./routes/category";
import shareRouter              from "./routes/share";
import explanationRouter        from "./routes/exaplantion";         // one-shot POST /api/explain
import explanationSessionRouter from "./routes/explanation-session"; // persistent sessions

const app = express();

app.set("trust proxy", 1);

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(securityHeaders);
app.use(
  cors({
    origin:         env.webAppUrl,
    credentials:    true,
    methods:        ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Admin-Secret"],
  }),
);
app.use(express.json({ limit: "256kb" }));

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);

// ── Algorithms + categories ───────────────────────────────────────────────────
app.use("/api/algorithms", generalRateLimiter(), algorithmRouter);
app.use("/api/categories", categoryRouter);

// ── Analysis ──────────────────────────────────────────────────────────────────
app.use("/api/analysis",  generalRateLimiter(), analysisRouter);
app.use("/api/analyses",  generalRateLimiter(), analysisRouter); // alias

// ── AI explain ────────────────────────────────────────────────────────────────
// IMPORTANT: sessions route MUST be registered before the generic explain route.
// Express does prefix matching with app.use, so the more-specific path must
// come first to prevent the generic router from intercepting session requests.
app.use("/api/explain/sessions", explanationSessionRouter); // persistent chat CRUD
app.use("/api/explain",          explanationRouter);         // one-shot stateless

// ── Public share ──────────────────────────────────────────────────────────────
app.use("/api/share", shareRouter);

// ── Admin ─────────────────────────────────────────────────────────────────────
app.use("/api/admin", adminRouter);

// ── Fallthrough ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export { app };