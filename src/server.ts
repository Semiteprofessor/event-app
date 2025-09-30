import "dotenv/config";
import http from "http";
import express from "express";
import { createServer } from "./app.js";
import { logger } from "./lib/logger.js";
import { context, trace, Span } from "@opentelemetry/api";
import { dashboardRouter } from "./server/queue-dashboard.js";

async function start(): Promise<void> {
  try {
    const app = await createServer();
    const port = Number(process.env.PORT) || 4000;

    const rootApp = express();

    rootApp.use(app);

    rootApp.use("/admin/queues", dashboardRouter);

    const server = http.createServer((req, res) => {
      const startTime = Date.now();

      const tracer = trace.getTracer("http-server");
      const span: Span = tracer.startSpan("http_request", {
        attributes: {
          "http.method": req.method || "UNKNOWN",
          "http.url": req.url || "UNKNOWN",
        },
      });

      res.on("finish", () => {
        const duration = Date.now() - startTime;
        logger.info(
          {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            durationMs: duration,
            traceId: span.spanContext().traceId,
          },
          "✅ Request handled"
        );

        span.setAttribute("http.status_code", res.statusCode);
        span.end();
      });

      context.with(trace.setSpan(context.active(), span), () => {
        rootApp(req, res);
      });
    });

    server.listen(port, () => {
      logger.info({ port }, `🚀 Server running at: http://localhost:${port}`);
      logger.info(
        `📊 BullMQ Dashboard available at: http://localhost:${port}/admin/queues`
      );
    });

    process.on("unhandledRejection", (reason: unknown) => {
      logger.error({ reason }, "⚠️ Unhandled Promise Rejection");
    });

    process.on("uncaughtException", (err: Error) => {
      logger.fatal({ err }, "💥 Uncaught Exception - shutting down...");
      process.exit(1);
    });

    process.on("SIGTERM", () => {
      logger.info("🛑 SIGTERM received. Gracefully shutting down...");
      server.close(() => process.exit(0));
    });
  } catch (err) {
    logger.fatal({ err }, "❌ Failed to start server");
    process.exit(1);
  }
}

start();
