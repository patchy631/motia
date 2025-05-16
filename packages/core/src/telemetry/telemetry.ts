import { initializeTracing } from './tracing';
import { createTracer } from './tracer';
import { createMetrics, createMetricsProvider, setupSystemMetricsCollection } from './metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { setupGlobalErrorHandlers } from './error-handler';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getTelemetryIdentityAttributes } from './identity';
import { handleError, isTelemetryEnabled } from './utils';
import type { TelemetryOptions, Telemetry, TracingOptions, MetricsOptions } from './types';

interface TelemetryProviders {
  tracerSdk: NodeSDK | undefined;
  systemMetricsInterval: NodeJS.Timeout | undefined;
}

/**
 * Creates and initializes the telemetry system for Motia
 */
export const createTelemetry = (options: TelemetryOptions): Telemetry => {
  const {
    serviceName,
    serviceVersion,
    instrumentationName,
  } = options;

  const environment = process.env.NODE_ENV || 'development';
  const endpoint = process.env.MOTIA_TELEMETRY_ENDPOINT || 'https://telemetry.motia.dev';
  const isEnabled = isTelemetryEnabled();
  const debug = process.env.MOTIA_TELEMETRY_DEBUG === 'true';
  const enableGlobalErrorHandlers = process.env.MOTIA_ENABLE_GLOBAL_ERROR_HANDLERS !== 'false';

  setupDebugLogging(debug);
  logTelemetryStatus(debug, isEnabled, serviceName, serviceVersion);
  
  const attributes = getTelemetryIdentityAttributes(instrumentationName);

  const { tracerSdk, systemMetricsInterval } = initializeTelemetryProviders({
    serviceName,
    serviceVersion,
    environment,
    instrumentationName,
    isEnabled,
    debug,
    attributes,
    endpoint,
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
  endpoint: string;
  attributes: Record<string, string>;
  enableGlobalErrorHandlers: boolean;
}): TelemetryProviders => {
  const {
    serviceName,
    serviceVersion,
    environment,
    instrumentationName,
    isEnabled,
    debug,
    endpoint,
    attributes,
    enableGlobalErrorHandlers
  } = config;

  let tracerSdk: NodeSDK | undefined;
  let systemMetricsInterval: NodeJS.Timeout | undefined;

  if (isEnabled) {
    try {
      createMetricsProvider({
        serviceName,
        serviceVersion,
        environment,
        customAttributes: attributes,
        debug,
        endpoint,
      });

      tracerSdk = initializeTracing({
        serviceName,
        serviceVersion,
        environment,
        debug,
        customAttributes: attributes,
        endpoint,
      });
      tracerSdk.start();

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