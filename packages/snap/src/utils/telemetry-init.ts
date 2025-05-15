import { createTelemetry, Telemetry, TelemetryOptions, findPackageJson } from '@motiadev/core';
import fs from 'fs';
import crypto from 'crypto';

/**
 * Initialize telemetry for the Snap package with privacy-focused identification
 * All identifying information is anonymized through one-way hashing
 */
export const initializeSnapTelemetry = (): Telemetry => {
  // Get configuration from environment
  const {
    enabled,
    environment,
    endpoint,
    debug,
    apiKey
  } = getTelemetryConfigFromEnv();
  
  if (!enabled) {
    return createDisabledTelemetry();
  }

  const { name, version } = getPackageDetails();
  
  const instrumentationName = generateInstrumentationName(name);
  
  const headers = apiKey ? { 'api-key': apiKey } : undefined;

  const telemetryOptions: TelemetryOptions = {
    serviceName: 'motia-framework',
    serviceVersion: version,
    environment,
    instrumentationName,
    tracing: {
      endpoint,
      debug,
      headers,
    },
    metrics: {
      endpoint,
      headers,
    },
    enableGlobalErrorHandlers: true,
    debug,
  };

  return createTelemetry(telemetryOptions);
};

/**
 * Create a disabled telemetry instance when telemetry is turned off
 */
const createDisabledTelemetry = (): Telemetry => {
  const noopTelemetry: Telemetry = {
    tracer: {} as any,
    metrics: {
      incrementCounter: () => {},
      recordValue: () => {},
      startTimer: () => () => 0,
      recordHistogram: () => {},
      isEnabled: () => false,
    },
    isEnabled: false,
    shutdown: async () => Promise.resolve(),
  };
  
  return noopTelemetry;
};

/**
 * Extract telemetry configuration from environment variables
 */
const getTelemetryConfigFromEnv = () => {
  return {
    enabled: process.env.MOTIA_TELEMETRY_ENABLED !== 'false',
    environment: process.env.NODE_ENV || 'development',
    endpoint: process.env.MOTIA_OTEL_EXPORTER_OTLP_ENDPOINT,
    debug: process.env.MOTIA_TELEMETRY_DEBUG === 'true',
    apiKey: process.env.NEW_RELIC_LICENSE_KEY || process.env.MOTIA_TELEMETRY_API_KEY,
  };
};

/**
 * Extract package information from package.json
 */
const getPackageDetails = () => {
  try {
    const packageJsonPath = findPackageJson(process.cwd());
    
    if (packageJsonPath && fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return {
        name: packageJson.name || 'unknown-package',
        version: packageJson.version || '0.0.0'
      };
    }
  } catch (error) {
    console.warn('Failed to detect package details:', error);
  }
  
  return {
    name: 'unknown-package',
    version: '0.0.0'
  };
};

/**
 * Generate a hashed instrumentation name from the package name
 * for privacy and consistency
 */
const generateInstrumentationName = (packageName: string): string => {
  return crypto.createHash('sha1').update(packageName).digest('hex').substring(0, 16);
}; 