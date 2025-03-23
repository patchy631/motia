import { DeploymentError } from './deployment-error'

export class DeploymentFailureError extends DeploymentError {
  constructor(error: string) {
    super(`Failed to finalize deployment: ${error}`, 'DEPLOYMENT_FAILURE', { error })
    this.name = 'DeploymentFailureError'
    Object.setPrototypeOf(this, DeploymentFailureError.prototype)
  }
}
