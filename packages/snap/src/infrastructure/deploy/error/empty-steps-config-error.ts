import { DeploymentError } from './deployment-error'

export class EmptyStepsConfigError extends DeploymentError {
  constructor() {
    super('Steps configuration is empty. Please check your dist/motia.steps.json file.', 'EMPTY_STEPS_CONFIG')
    this.name = 'EmptyStepsConfigError'
    Object.setPrototypeOf(this, EmptyStepsConfigError.prototype)
  }
}
