import { DeploymentError } from './deployment-error'

export class NoZipFilesError extends DeploymentError {
  constructor() {
    super('No zip files found for deployment.', 'NO_ZIP_FILES')
    this.name = 'NoZipFilesError'
    Object.setPrototypeOf(this, NoZipFilesError.prototype)
  }
}
