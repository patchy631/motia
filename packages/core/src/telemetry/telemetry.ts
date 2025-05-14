import { TracingOptions, initializeTracing } from './tracing';
import { MotiaTracer, createTracer } from './tracer';
import { MetricsOptions, MotiaMetrics, createMetrics, createMetricsProvider, setupSystemMetricsCollection } from './metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { setupGlobalErrorHandlers } from './error-handler';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getTelemetryIdentityAttributes } from './identity';

/**
 * Options for configuring Motia's telemetry
 */
export interface TelemetryOptions {
  /** Name of the service or application */
  serviceName: string;
  /** Version of the service */
  serviceVersion: string;
  /** Deployment environment (production, staging, development) */
  environment: string;
  /** Name for this instrumentation to identify in spans */
  instrumentationName: string;
  /** Specific options for tracing */
  tracing?: Omit<TracingOptions, 'serviceName' | 'serviceVersion' | 'environment'>;
  /** Specific options for metrics */
  metrics?: Omit<MetricsOptions, 'serviceName' | 'serviceVersion' | 'environment'>;
  /** Whether to set up global handlers for uncaught exceptions */
  enableGlobalErrorHandlers?: boolean;
  /** Whether to log diagnostic messages */
  debug?: boolean;
  /** Additional custom attributes to include in all telemetry */
  customAttributes?: Record<string, string>;
}

/**
 * Telemetry interface exposing observability capabilities
 */
export interface Telemetry {
  /** Tracer for creating spans and recording trace data */
  tracer: MotiaTracer;
  /** Metrics collector for recording metrics */
  metrics: MotiaMetrics;
  /** Gracefully shut down telemetry providers */
  shutdown: () => Promise<void>;
  /** Whether telemetry is currently enabled */
  isEnabled: boolean;
}

/**
 * Creates and initializes the telemetry system for Motia
 */
export function createTelemetry(options: TelemetryOptions): Telemetry {
  const {
    serviceName,
    serviceVersion,
    environment,
    instrumentationName,
    tracing = {},
    metrics = {},
    enableGlobalErrorHandlers = true,
    debug = false,
    customAttributes = {}
  } = options;

  // Check if telemetry is explicitly disabled
  const isEnabled = process.env.MOTIA_TELEMETRY_ENABLED !== 'false';
  
  // Set up debug logging if enabled
  if (debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  // Log telemetry initialization status
  if (debug) {
    console.debug(`Motia telemetry ${isEnabled ? 'enabled' : 'disabled'} for ${serviceName}@${serviceVersion}`);
  }
  
  // Combine identity attributes with any custom attributes
  const combinedAttributes = {
    ...getTelemetryIdentityAttributes(),
    ...customAttributes
  };

  let tracerSdk: NodeSDK | undefined;
  let metricsProvider: MeterProvider | undefined;
  let systemMetricsInterval: NodeJS.Timeout | undefined;

  if (isEnabled) {
    try {
      // Initialize tracing
      tracerSdk = initializeTracing({
        serviceName,
        serviceVersion,
        environment,
        debug,
        customAttributes: combinedAttributes,
        ...tracing,
      });
      tracerSdk.start();

      // Initialize metrics
      metricsProvider = createMetricsProvider({
        serviceName,
        serviceVersion,
        environment,
        customAttributes: combinedAttributes,
        ...metrics,
      });

      // Set up global error handlers
      if (enableGlobalErrorHandlers) {
        setupGlobalErrorHandlers();
      }
      
      // Set up system metrics collection
      const metricsCollector = createMetrics(instrumentationName);
      systemMetricsInterval = setupSystemMetricsCollection(metricsCollector, debug);
      
    } catch (error) {
      // Telemetry initialization should never break application
      console.error('Failed to initialize telemetry:', error);
      
      // Reset to no-op state if initialization fails
      tracerSdk = undefined;
      metricsProvider = undefined;
      if (systemMetricsInterval) {
        clearInterval(systemMetricsInterval);
        systemMetricsInterval = undefined;
      }
    }
  }

  const tracer = createTracer(instrumentationName);
  const metricsCollector = createMetrics(instrumentationName);

  return {
    tracer,
    metrics: metricsCollector,
    isEnabled,
    shutdown: async (): Promise<void> => {
      if (systemMetricsInterval) {
        clearInterval(systemMetricsInterval);
      }
      
      if (!tracerSdk) {
        return Promise.resolve();
      }
      
      try {
        if (debug) {
          console.debug('Shutting down telemetry providers');
        }
        return tracerSdk.shutdown();
      } catch (error) {
        console.error('Error shutting down telemetry:', error);
        return Promise.resolve();
      }
    },
  };
} 