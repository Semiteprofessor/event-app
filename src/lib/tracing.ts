// import { NodeSDK } from "@opentelemetry/sdk-node";
// import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
// import {
//   ConsoleSpanExporter,
//   SimpleSpanProcessor,
// } from "@opentelemetry/sdk-trace-base";
// import { Resource } from "@opentelemetry/resources";
// import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

// let sdk: NodeSDK | null = null;

// export function initTracing() {
//   if (sdk) return;

//   sdk = new NodeSDK({
//     resource: new Resource({
//       [ATTR_SERVICE_NAME]: "my-service", // 👈 change this to your service name
//     }),
//     traceExporter: new ConsoleSpanExporter(),
//     instrumentations: [getNodeAutoInstrumentations()],
//   });

//   sdk.start();

//   process.on("SIGTERM", () => {
//     sdk
//       ?.shutdown()
//       .then(() => console.log("✅ Tracing terminated"))
//       .catch((err) => console.error("❌ Error terminating tracing", err))
//       .finally(() => process.exit(0));
//   });

//   console.log("📡 OpenTelemetry tracing initialized");
// }
