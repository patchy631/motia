import { Attributes, Span, SpanOptions } from "@opentelemetry/api"
import { NodeSDK } from '@opentelemetry/sdk-node'

/**
 * Options for configuring tracing
 */
export interface TracingOptions {
  /** Service name */
  serviceName: string
  /** Service version */
  serviceVersion: string
  /** Environment (dev, prod, etc) */
  environment: string
  /** OTLP endpoint for exporting traces */
  endpoint?: string
  /** Enable debug logging */
  debug?: boolean
  /** Custom headers for trace export requests */
  headers?: Record<string, string>
  /** Sampling ratio (0-1) */
  samplingRatio?: number
  /** Custom attributes to include with all traces */
  customAttributes?: Record<string, string>
}

/**
 * Options for configuring metrics
 */
export interface MetricsOptions {
  /** Service name */
  serviceName: string
  /** Service version */
  serviceVersion: string
  /** Environment (dev, prod, etc) */
  environment: string
  /** OTLP endpoint for exporting metrics */
  endpoint?: string
  /** Custom headers for metric export requests */
  headers?: Record<string, string>
  /** Interval in milliseconds for exporting metrics */
  exportIntervalMillis?: number
  /** Whether to disable automatic host metrics collection */
  disableDefaultMetrics?: boolean
  /** Enable debug logging */
  debug?: boolean
  /** Custom attributes to include with all metrics */
  customAttributes?: Record<string, string>
}

/**
 * Interface for metrics collection
 */
export interface MotiaMetrics {
  /** Increment a counter metric */
  incrementCounter: (name: string, value?: number, attributes?: Record<string, string>) => void
  /** Record a gauge value */
  recordValue: (name: string, value: number, attributes?: Record<string, string>) => void
  /** Start a timer and return a function to stop and record the duration */
  startTimer: (name: string, attributes?: Record<string, string>) => () => number
  /** Record a histogram value */
  recordHistogram: (name: string, value: number, attributes?: Record<string, string>) => void
  /** Check if telemetry is enabled */
  isEnabled: () => boolean
}

/**
 * Options for configuring the telemetry system
 */
export interface TelemetryOptions {
  /** Name of the service or application */
  serviceName: string
  /** Version of the service */
  serviceVersion: string
  /** Deployment environment (production, staging, development) */
  environment: string
  /** Name for this instrumentation to identify in spans */
  instrumentationName: string
  /** Specific options for tracing */
  tracing?: Omit<TracingOptions, 'serviceName' | 'serviceVersion' | 'environment'>
  /** Specific options for metrics */
  metrics?: Omit<MetricsOptions, 'serviceName' | 'serviceVersion' | 'environment'>
  /** Whether to set up global handlers for uncaught exceptions */
  enableGlobalErrorHandlers?: boolean
  /** Whether to log diagnostic messages */
  debug?: boolean
  /** Additional custom attributes to include in all telemetry */
  customAttributes?: Record<string, string>
}

/**
 * Main telemetry interface
 */
export interface Telemetry {
  /** Tracer for creating spans and recording trace data */
  tracer: MotiaTracer
  /** Metrics collector for recording metrics */
  metrics: MotiaMetrics
  /** Gracefully shut down telemetry providers */
  shutdown: () => Promise<void>
  /** Whether telemetry is currently enabled */
  isEnabled: boolean
}

export interface MotiaTracer {
  startSpan: (name: string, options?: SpanOptions) => Span
  startActiveSpan: <T>(name: string, callback: (span: Span) => T, options?: SpanOptions) => T
  getCurrentSpan: () => Span | undefined
  withSpan: <T>(span: Span, callback: () => T) => T
  recordException: (exception: Error, span?: Span) => void
  addEvent: (name: string, attributes?: Attributes, span?: Span) => void
  setAttributes: (attributes: Attributes, span?: Span) => void
  isRecording: (span?: Span) => boolean
}
