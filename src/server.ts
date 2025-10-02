import "dotenv/config";
import http from "http";
import express, { Request } from "express";
import { createServer } from "./app.js";
import { logger } from "./lib/logger.js";
import { context as otelContext, trace, Span } from "@opentelemetry/api";
import { dashboardRouter } from "./server/queue-dashboard.js";

async function start(): Promise<void> {
  try {
    const port = Number(process.env.PORT) || 4000;

    // ✅ Express parent app
    const rootApp = express();
    rootApp.use(express.json());
    rootApp.use(express.urlencoded({ extended: true }));

    // ✅ Create Apollo + GraphQL server, injecting user into context
    const app = await createServer();

    rootApp.use(app);

    // ✅ BullMQ dashboard route
    rootApp.use("/admin/queues", dashboardRouter);

    // ✅ Health check route
    rootApp.get("/health", (req, res) => {
      res.status(200).json({ status: "ok" });
    });

    // ✅ Wrap server with OpenTelemetry tracing
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
        span.setAttribute("http.response_time_ms", duration);
        span.end();
      });

      otelContext.with(trace.setSpan(otelContext.active(), span), () => {
        rootApp(req, res);
      });
    });

    // ✅ Start the server
    server.listen(port, () => {
      logger.info(`🚀 Server running at: http://localhost:${port}`);
      logger.info(`📊 BullMQ Dashboard: http://localhost:${port}/admin/queues`);
      logger.info(`💓 Health Check: http://localhost:${port}/health`);
    });

    // ✅ Handle common process events
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
