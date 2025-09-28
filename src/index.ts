import "dotenv/config";
import http from "http";
import { createServer } from "./app";
import { initTracing } from "./lib/tracing";
import { logger } from "./lib/logger";

async function start() {
  initTracing();
  const app = await createServer();
  const port = process.env.PORT ?? 4000;

  const server = http.createServer(app);
  server.listen(port, () => {
    logger.info(`Server listening on ${port}`);
  });
  process.on("unhandledRejection", (err) => {
    logger.error("unhandledRejection", err);
  });
  process.on("uncaughtException", (err) => {
    logger.error("uncaughtException", err);
    process.exit(1);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
