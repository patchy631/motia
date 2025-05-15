import { initializeTracing } from './tracing';
import { createTracer } from './tracer';
import { createMetrics, createMetricsProvider, setupSystemMetricsCollection } from './metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { setupGlobalErrorHandlers } from './error-handler';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getTelemetryIdentityAttributes } from './identity';
import { handleError, isTelemetryEnabled } from './utils';
import type { TelemetryOptions, Telemetry, TracingOptions, MetricsOptions } from './types';

/**
 * Creates and initializes the telemetry system for Motia
 */
export const createTelemetry = (options: TelemetryOptions): Telemetry => {
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

  const isEnabled = isTelemetryEnabled();
  
  setupDebugLogging(debug);
  logTelemetryStatus(debug, isEnabled, serviceName, serviceVersion);
  
  const combinedAttributes = {
    ...getTelemetryIdentityAttributes(),
    ...customAttributes
  };

  const { tracerSdk, systemMetricsInterval } = initializeTelemetryProviders({
    serviceName,
    serviceVersion,
    environment,
    instrumentationName,
    isEnabled,
    debug,
    combinedAttributes,
    tracing,
    metrics,
    enableGlobalErrorHandlers
  });

  const tracer = createTracer(instrumentationName);
  const metricsCollector = createMetrics(instrumentationName);

  return {
    tracer,
    metrics: metricsCollector,
    isEnabled,
    shutdown: async (): Promise<void> => {
      return shutdownTelemetry(tracerSdk, systemMetricsInterval, debug);
    },
  };
}

interface TelemetryProviders {
  tracerSdk: NodeSDK | undefined;
  systemMetricsInterval: NodeJS.Timeout | undefined;
}

const setupDebugLogging = (debug: boolean): void => {
  if (debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }
}

const logTelemetryStatus = (debug: boolean, isEnabled: boolean, serviceName: string, serviceVersion: string): void => {
  if (debug) {
    console.debug(`Motia telemetry ${isEnabled ? 'enabled' : 'disabled'} for ${serviceName}@${serviceVersion}`);
  }
}

const initializeTelemetryProviders = (config: {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  instrumentationName: string;
  isEnabled: boolean;
  debug: boolean;
  combinedAttributes: Record<string, string>;
  tracing: Partial<TracingOptions>;
  metrics: Partial<MetricsOptions>;
  enableGlobalErrorHandlers: boolean;
}): TelemetryProviders => {
  const {
    serviceName,
    serviceVersion,
    environment,
    instrumentationName,
    isEnabled,
    debug,
    combinedAttributes,
    tracing,
    metrics,
    enableGlobalErrorHandlers
  } = config;

  let tracerSdk: NodeSDK | undefined;
  let systemMetricsInterval: NodeJS.Timeout | undefined;

  if (isEnabled) {
    try {
      tracerSdk = initializeTracing({
        serviceName,
        serviceVersion,
        environment,
        debug,
        customAttributes: combinedAttributes,
        ...tracing,
      });
      tracerSdk.start();

      createMetricsProvider({
        serviceName,
        serviceVersion,
        environment,
        customAttributes: combinedAttributes,
        debug,
        ...metrics,
      });

      if (enableGlobalErrorHandlers) {
        setupGlobalErrorHandlers();
      }
      
      const metricsCollector = createMetrics(instrumentationName);
      systemMetricsInterval = setupSystemMetricsCollection(metricsCollector, debug);
      
    } catch (error) {
      handleError(error, 'initializing telemetry', debug);
      tracerSdk = undefined;
      if (systemMetricsInterval) {
        clearInterval(systemMetricsInterval);
        systemMetricsInterval = undefined;
      }
    }
  }

  return { tracerSdk, systemMetricsInterval };
}

const shutdownTelemetry = async (
  tracerSdk: NodeSDK | undefined, 
  systemMetricsInterval: NodeJS.Timeout | undefined,
  debug: boolean
): Promise<void> => {
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
    handleError(error, 'shutting down telemetry', debug);
    return Promise.resolve();
  }
} 