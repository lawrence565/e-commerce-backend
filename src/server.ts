import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabase } from "./db/client.js";

export function startServer() {
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`Listening on port ${env.port}`);
  });

  async function shutdown() {
    console.log("Shutting down server");
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return server;
}
