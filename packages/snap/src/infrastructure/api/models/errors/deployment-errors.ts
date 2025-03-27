import { ApiError } from '../../core/api-base'
import path from 'path'

export class DeploymentError extends ApiError {
  constructor(message: string, details?: string, code = 'DEPLOYMENT_ERROR') {
    super({
      status: 500,
      message,
      details,
      code
    })
    this.name = 'DeploymentError'
  }
}

export class FileUploadError extends DeploymentError {
  constructor(error: unknown, filePath: string) {
    const fileName = path.basename(filePath)
    const details = error instanceof Error ? error.message : String(error)
    super(`Unable to upload ${fileName}`, details, 'FILE_UPLOAD_ERROR')
    this.name = 'FileUploadError'
  }
}

export class InvalidConfigError extends DeploymentError {
  constructor(message = 'Invalid deployment configuration') {
    super(message, undefined, 'INVALID_CONFIG')
    this.name = 'InvalidConfigError'
  }
}

export class VersionPromotionError extends DeploymentError {
  constructor(version: string, stageId: string, error?: Error) {
    const details = error instanceof ApiError ? error.message : error?.message
    super(`Unable to promote version ${version} to stage ${stageId}`, details, 'VERSION_PROMOTION_ERROR')
    this.name = 'VersionPromotionError'
  }
}

export class DeploymentStartError extends DeploymentError {
  constructor(deploymentId: string, error?: Error) {
    const details = error instanceof ApiError ? error.message : error?.message
    super(`Unable to start deployment ${deploymentId}`, details, 'DEPLOYMENT_START_ERROR')
    this.name = 'DeploymentStartError'
  }
}

export class DeploymentNotFoundError extends DeploymentError {
  constructor(deploymentId: string) {
    super(
      `Deployment ${deploymentId} not found`,
      'The specified deployment does not exist or has been deleted',
      'DEPLOYMENT_NOT_FOUND'
    )
    this.name = 'DeploymentNotFoundError'
  }
} 