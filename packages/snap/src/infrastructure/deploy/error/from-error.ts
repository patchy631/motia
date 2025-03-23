import { DeploymentError } from './deployment-error'

export class GenericDeploymentError extends DeploymentError {
  constructor(error: unknown, code: string, defaultMessage: string) {
    const message = error instanceof Error ? error.message : String(error)
    super(
      message || defaultMessage,
      code,
      typeof error === 'object' && error !== null && !(error instanceof Error)
        ? (error as Record<string, string>)
        : { originalError: message },
    )
    this.name = 'GenericDeploymentError'
    Object.setPrototypeOf(this, GenericDeploymentError.prototype)
  }
}
