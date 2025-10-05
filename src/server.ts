require("dotenv/config");

import * as http from "http";
const express = require("express");
const { createServer } = require("./app");
const { logger } = require("./lib/logger.js");
const { context: otelContext, trace, Span } = require("@opentelemetry/api");
const { dashboardRouter } = require("./server/queue-dashboard.js");
import type { Request, Response } from "express";
import type { IncomingMessage, ServerResponse } from "http";
import type { Tracer, Span as OtelSpan } from "@opentelemetry/api";

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
    interface HealthResponse {
      status: string;
    }

    rootApp.get("/health", (req: Request, res: Response<HealthResponse>) => {
      res.status(200).json({ status: "ok" });
    });

    // ✅ Wrap server with OpenTelemetry tracing
    interface RequestLogInfo {
      method?: string;
      url?: string;
      statusCode?: number;
      durationMs: number;
      traceId: string;
    }

    const server: http.Server = http.createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        const startTime: number = Date.now();
        const tracer: Tracer = trace.getTracer("http-server");

        const span: OtelSpan = tracer.startSpan("http_request", {
          attributes: {
            "http.method": req.method || "UNKNOWN",
            "http.url": req.url || "UNKNOWN",
          },
        });

        res.on("finish", () => {
          const duration: number = Date.now() - startTime;

          const logInfo: RequestLogInfo = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            durationMs: duration,
            traceId: span.spanContext().traceId,
          };

          logger.info(logInfo, "✅ Request handled");

          span.setAttribute("http.status_code", res.statusCode);
          span.setAttribute("http.response_time_ms", duration);
          span.end();
        });

        otelContext.with(trace.setSpan(otelContext.active(), span), () => {
          rootApp(req, res);
        });
      }
    );

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
