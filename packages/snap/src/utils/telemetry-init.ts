import { createTelemetry, Telemetry, TelemetryOptions, findPackageJson, isTelemetryEnabled } from '@motiadev/core'
import fs from 'fs';
import crypto from 'crypto';

/**
 * Initialize telemetry for the Snap package with privacy-focused identification
 * All identifying information is anonymized through one-way hashing
 */
export const initializeSnapTelemetry = (): Telemetry => {
  if (!isTelemetryEnabled()) {
    return createDisabledTelemetry();
  }

  const { name, version } = getPackageDetails();
  
  const instrumentationName = generateInstrumentationName(name);

  const telemetryOptions: TelemetryOptions = {
    serviceName: 'motia-framework',
    serviceVersion: version,
    instrumentationName,
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

const generateInstrumentationName = (packageName: string): string => {
  return crypto.createHash('sha1').update(packageName).digest('hex').substring(0, 16);
}; 