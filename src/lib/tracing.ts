// import { NodeSDK } from "@opentelemetry/sdk-node";
// import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
// import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
// import { Resource } from "@opentelemetry/resources";
// import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

// let sdk: NodeSDK | null = null;

// export function initTracing() {
//   if (sdk) return;

//   const traceExporter = new OTLPTraceExporter({
//     url: process.env.OTLP_URL || "http://localhost:4318/v1/traces",
//   });

//   sdk = new NodeSDK({
//     traceExporter,
//     resource: new Resource({
//       [SemanticResourceAttributes.SERVICE_NAME]: "world-class-backend",
//       [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
//         process.env.NODE_ENV || "development",
//     }),
//     instrumentations: [getNodeAutoInstrumentations()],
//   });

//   sdk.start();

//   process.on("SIGTERM", () => {
//     sdk?.shutdown().then(
//       () => console.log("Tracing terminated"),
//       (err) => console.error("Error terminating tracing", err)
//     );
//   });
// }
