import crypto from 'crypto'
import os from 'os'
import fs from 'fs'
import path from 'path'
import { findPackageJson } from './utils'

/**
 * Gets the version of the Motia Core package
 */
const getMotiaVersion = (): string => {
  try {
    // Find the package.json for the Motia Core package
    const moduleDir = path.resolve(__dirname, '../../')
    const packageJsonPath = path.join(moduleDir, 'package.json')
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      return packageJson.version || '0.0.0'
    }
    
    return '0.0.0'
  } catch {
    return '0.0.0'
  }
};

/**
 * Generates a stable project ID based on package.json and workspace path
 * using a one-way hash that cannot be reversed
 */
export const generateProjectId = (workspacePath?: string): string => {
  try {
    // Try to get package.json for project identification
    const cwd = workspacePath || process.cwd()
    const packageJsonPath = findPackageJson(cwd)
    
    let projectInfo: string
    
    if (packageJsonPath && fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      projectInfo = packageJson.name || 'unknown'
    } else {
      // If no package.json, use the directory hash instead of name (for privacy)
      const dirHash = crypto.createHash('sha256').update(path.basename(cwd)).digest('hex').substring(0, 8)
      projectInfo = `project-${dirHash}`
    }
    
    // Generate a consistent hash of the project info
    return crypto
      .createHash('sha256')
      .update(projectInfo)
      .digest('hex')
      .substring(0, 16)
  } catch {
    // Fallback if anything fails
    return 'unknown-project'
  }
};

/**
 * Generates a stable anonymous user ID by hashing machine-specific information
 * This is designed to be consistent across runs but not personally identifiable
 * and cannot be reversed to original values
 */
export const generateUserId = (): string => {
  try {
    // Combine only non-personally identifiable system information
    // Explicitly avoid usernames, home directory paths, or machine names that could be identifiable
    const machineParts = [
      // Use only hardware and OS information, nothing user-specific
      os.platform(),
      os.arch(),
      os.release(),
      // Include CPU details without serial numbers
      os.cpus()[0]?.model.replace(/[0-9]/g, '') || '',
      // Include memory size as a hardware identifier
      Math.floor(os.totalmem() / (1024 * 1024 * 100)).toString() + '00MB'
    ]
    
    // Create machine fingerprint
    const machineId = machineParts.join('|')
    
    // Apply multiple hash rounds for additional security
    let hashedId = machineId
    for (let i = 0; i < 3; i++) {
      hashedId = crypto.createHash('sha256').update(hashedId).digest('hex')
    }
    
    // Return a shorter hash that cannot be reversed
    return 'u' + hashedId.substring(0, 15)
  } catch {
    // Fallback if anything fails
    return 'unknown-user'
  }
};

/**
 * Provides custom attributes for telemetry to identify the project and user
 * while ensuring privacy through irreversible hashing
 */
export const getTelemetryIdentityAttributes = (
  additionalAttributes: Record<string, string> = {}
): Record<string, string> => {
  const projectId = generateProjectId()
  const userId = generateUserId()
  const motiaVersion = getMotiaVersion()
  
  return {
    'motia.project.id': projectId,
    'motia.user.id': userId,
    'motia.runtime': process.version,
    'motia.os.platform': os.platform(),
    'motia.version': motiaVersion,
    ...additionalAttributes
  }
}; 