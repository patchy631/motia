import crypto from 'crypto'
import os from 'os'

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
export const getTelemetryIdentityAttributes = (projectId: string): Record<string, string> => {
  const userId = generateUserId()

  return {
    'motia.project.id': projectId,
    'motia.user.id': userId,
    'motia.runtime': process.version,
    'motia.os.platform': os.platform(),
    'motia.version': process.env.npm_package_dependencies_motia || '0.0.0',
  }
}; 