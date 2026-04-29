//filename: apps/api/src/app.ts

import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { securityHeaders } from "./middleware/security-headers";
import adminRouter from "./routes/admin";
import algorithmRouter from "./routes/algorithm";
import analysisRouter from "./routes/analysis";
import authRouter from "./routes/auth";
import categoryRouter from "./routes/category";
import shareRouter from "./routes/share";

const app = express();

app.set("trust proxy", 1);

app.use(securityHeaders);
app.use(
  cors({
    origin: env.webAppUrl,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Admin-Secret"],
  }),
);
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/analysis", analysisRouter);
app.use("/api/analyses", analysisRouter);
app.use("/api/share", shareRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/algorithms", algorithmRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };