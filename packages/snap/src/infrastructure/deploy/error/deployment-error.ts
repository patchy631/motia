export class DeploymentError extends Error {
  public readonly code: string
  public readonly context?: { [key: string]: unknown }

  constructor(message: string, code: string, context?: { [key: string]: unknown }) {
    super(message)
    this.name = 'DeploymentError'
    this.code = code
    this.context = context
    Object.setPrototypeOf(this, DeploymentError.prototype)
  }
}
