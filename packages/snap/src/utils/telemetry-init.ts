import { createTelemetry, Telemetry, TelemetryOptions, getTelemetryIdentityAttributes } from '@motiadev/core';
import fs from 'fs';
import path from 'path';

export interface SnapTelemetryOptions {
  enabled?: boolean;
  environment?: string;
  endpoint?: string;
  debug?: boolean;
  attributes?: Record<string, string>;
}

/**
 * Initialize telemetry for the Snap package with privacy-focused identification
 * All identifying information is anonymized through one-way hashing
 */
export function initializeSnapTelemetry(options: SnapTelemetryOptions = {}): Telemetry {
  // Try to detect package version from closest package.json
  let serviceVersion = '0.0.0';
  let serviceName = 'motia-user-app';
  
  try {
    // Look for the user's package.json, starting from the current directory
    const packageJsonPath = findPackageJson(process.cwd());
    
    if (packageJsonPath) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      serviceVersion = packageJson.version || '0.0.0';
      serviceName = require('crypto').createHash('sha1').update(packageJson.name).digest('hex');
    }
  } catch (error) {
    console.warn('Failed to detect service version:', error);
  }

  // Get privacy-safe identity attributes
  const identityAttributes = getTelemetryIdentityAttributes();
  
  // Combine with user-provided attributes
  const combinedAttributes = {
    ...identityAttributes,
    ...(options.attributes || {}),
  };

  const telemetryOptions: TelemetryOptions = {
    serviceName,
    serviceVersion,
    environment: options.environment || process.env.NODE_ENV || 'development',
    instrumentationName: 'motia-snap',
    tracing: {
      endpoint: options.endpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      debug: options.debug || process.env.MOTIA_TELEMETRY_DEBUG === 'true',
    },
    metrics: {
      endpoint: options.endpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
    customAttributes: combinedAttributes,
    enableGlobalErrorHandlers: true,
    debug: options.debug || process.env.MOTIA_TELEMETRY_DEBUG === 'true',
  };

  return createTelemetry(telemetryOptions);
}

/**
 * Find the closest package.json file by walking up the directory tree
 * @param startDir The directory to start searching from
 * @param maxDepth Maximum number of parent directories to check
 * @returns Path to package.json or null if not found
 */
function findPackageJson(startDir: string, maxDepth = 3): string | null {
  let currentDir = startDir;
  
  for (let i = 0; i < maxDepth; i++) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      return packageJsonPath;
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // We've reached the root directory
      break;
    }
    
    currentDir = parentDir;
  }
  
  return null;
}

/**
 * Get telemetry configuration from environment variables
 * @returns Configuration object with values from environment variables
 */
export function getTelemetryConfigFromEnv(): SnapTelemetryOptions {
  return {
    enabled: process.env.MOTIA_TELEMETRY_ENABLED !== 'false',
    environment: process.env.NODE_ENV,
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    debug: process.env.MOTIA_TELEMETRY_DEBUG === 'true',
  };
} 