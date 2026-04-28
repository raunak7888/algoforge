import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  if (!env.isProduction) {
    console.log(`[API] Server running at ${env.apiBaseUrl}`);
    console.log(`[API] Health check: ${env.apiBaseUrl}/health`);
  }
});