import path from 'path';
import fs from 'fs'
import { Attributes } from '@opentelemetry/api';

export const DEFAULT_METRICS_INTERVAL = 30000;

export const isTelemetryEnabled = (): boolean => {
  return process.env.MOTIA_TELEMETRY_ENABLED !== 'false';
};

export const handleError = (error: unknown, context: string, debug = false): void => {
  if (debug) {
    console.debug(`Error in ${context}:`, error);
  }
};

export const sanitizeAttributes = (attributes: Attributes): Attributes => {
  const result: Attributes = {};
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      try {
        result[key] = JSON.stringify(value);
      } catch (e) {
        result[key] = String(value);
      }
    } else if (
      typeof value === 'string' || 
      typeof value === 'number' || 
      typeof value === 'boolean' || 
      Array.isArray(value)
    ) {
      result[key] = value as Attributes[keyof Attributes];
    } else {
      result[key] = String(value);
    }
  });
  
  return result;
};

export const getActiveHandlesCount = (): number | undefined => {
  try {
    const processAny = process as any;
    if (typeof processAny._getActiveHandles === 'function') {
      const handles = processAny._getActiveHandles();
      return Array.isArray(handles) ? handles.length : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

export const getActiveRequestsCount = (): number | undefined => {
  try {
    const processAny = process as any;
    if (typeof processAny._getActiveRequests === 'function') {
      const requests = processAny._getActiveRequests();
      return Array.isArray(requests) ? requests.length : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}; 

export const findPackageJson = (startDir: string, maxDepth = 3): string | null => {
  let currentDir = startDir;
  
  for (let i = 0; i < maxDepth; i++) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      return packageJsonPath;
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    
    currentDir = parentDir;
  }
  
  return null;
};