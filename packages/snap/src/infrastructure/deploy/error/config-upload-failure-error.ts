import { DeploymentError } from './deployment-error'

export class ConfigUploadFailureError extends DeploymentError {
  constructor(error: string) {
    super(`Failed to upload configuration: ${error}`, 'CONFIG_UPLOAD_FAILURE', { error })
    this.name = 'ConfigUploadFailureError'
    Object.setPrototypeOf(this, ConfigUploadFailureError.prototype)
  }
}
