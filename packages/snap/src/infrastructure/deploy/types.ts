/**
 * Type definitions for the deployment system
 */

/**
 * Configuration for a step
 */
export interface StepConfig {
  type: 'node' | 'python'
  entrypointPath: string
  config: { [key: string]: string }
}

/**
 * Configuration for all steps
 */
export interface StepsConfig {
  [bundlePath: string]: StepConfig
}

/**
 * Configuration for deployment
 */
export interface DeploymentConfig {
  apiKey: string
  stageId: string
  version: string
}

/**
 * Result of a deployment operation
 */
export interface DeploymentResult {
  bundlePath: string
  deploymentId?: string
  stepType: string
  stepName: string
  stepPath?: string
  flowName: string
  environment: string
  version: string
  error?: string
  success: boolean
}

/**
 * Information about a zip file to be deployed
 */
export interface ZipFileInfo {
  zipPath: string
  bundlePath: string
  stepName: string
  config: StepConfig
}

/**
 * Summary of a deployment operation
 */
export interface DeploymentSummary {
  deploymentTime: string
  environment: string
  version: string
}

export interface UploadResult {
  bundlePath: string
  uploadId?: string
  stepType: string
  stepName: string
  error?: string
  success: boolean
}
