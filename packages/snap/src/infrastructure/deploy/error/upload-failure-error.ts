import { DeploymentError } from './deployment-error'

export class UploadFailureError extends DeploymentError {
  constructor(path: string, error: string) {
    super(`Failed to upload ${path}: ${error}`, 'UPLOAD_FAILURE', { path, error })
    this.name = 'UploadFailureError'
    Object.setPrototypeOf(this, UploadFailureError.prototype)
  }
}
