import "dotenv/config";
import http from "http";
import { createServer } from "./app";
import { initTracing } from "./lib/tracing";
import { logger } from "./lib/logger";
import { context, trace } from "@opentelemetry/api";

async function start() {
  initTracing();

  const app = await createServer();
  const port = process.env.PORT ?? 4000;

  const server = http.createServer((req, res) => {
    const start = Date.now();

    const tracer = trace.getTracer("http-server");
    const span = tracer.startSpan("http_request", {
      attributes: {
        "http.method": req.method,
        "http.url": req.url,
      },
    });

    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info(
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          durationMs: duration,
          traceId: span.spanContext().traceId,
        },
        "Handled request"
      );
      span.setAttribute("http.status_code", res.statusCode);
      span.end();
    });

    context.with(trace.setSpan(context.active(), span), () => {
      app(req, res);
    });
  });

  server.listen(port, () => {
    logger.info({ port }, `🚀 Server listening on http://localhost:${port}`);
  });

  process.on("unhandledRejection", (err) => {
    logger.error({ err }, "Unhandled Promise Rejection");
  });

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught Exception");
    process.exit(1);
  });
}

start().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
