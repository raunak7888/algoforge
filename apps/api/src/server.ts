import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`[API] Server running at ${env.apiBaseUrl}`);
  console.log(`[API] Health check: ${env.apiBaseUrl}/health`);
});
