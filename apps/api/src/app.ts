import express from "express";
import cors from "cors";
import { analysisRouter } from "./routes/analysis";
import authRouter from './routes/auth';

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use("/api/analysis", analysisRouter);

export { app };
