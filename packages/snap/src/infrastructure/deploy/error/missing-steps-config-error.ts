import { DeploymentError } from './deployment-error'

export class MissingStepsConfigError extends DeploymentError {
  constructor() {
    super('motia.steps.json not found. Please run the build command first.', 'MISSING_STEPS_CONFIG')
    this.name = 'MissingStepsConfigError'
    Object.setPrototypeOf(this, MissingStepsConfigError.prototype)
  }
}
