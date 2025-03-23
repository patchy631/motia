import { DeploymentError } from './deployment-error'

export class MissingApiKeyError extends DeploymentError {
  constructor() {
    super('API key is required for deployment. Please provide an API key.', 'MISSING_API_KEY')
    this.name = 'MissingApiKeyError'
    Object.setPrototypeOf(this, MissingApiKeyError.prototype)
  }
}
