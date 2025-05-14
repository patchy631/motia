// Tracing exports
export { initializeTracing } from './tracing';
export type { TracingOptions } from './tracing';

// Metrics exports
export { createMetricsProvider, createMetrics } from './metrics';
export type { MetricsOptions, MotiaMetrics } from './metrics';

// Tracer exports
export { createTracer } from './tracer';
export type { MotiaTracer } from './tracer';

// Error handling exports
export { recordException, setupGlobalErrorHandlers } from './error-handler';

// Main telemetry exports
export { createTelemetry } from './telemetry';
export type { Telemetry, TelemetryOptions } from './telemetry'; 

// Identity exports
export { generateProjectId, generateUserId, getTelemetryIdentityAttributes } from './identity';