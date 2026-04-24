import { app } from "./app";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[API] Server running at http://localhost:${PORT}`);
  console.log(`[API] Health check: http://localhost:${PORT}/health`);
});
