import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/index.js";

const server = createApp().listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}/api/v1`);
});

// Close connections cleanly on Ctrl+C / container stop
const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
