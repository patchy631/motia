import { DeploymentError } from './deployment-error'

export class ZipFileNotFoundError extends DeploymentError {
  constructor(zipPath: string) {
    super(`Zip file not found: ${zipPath}. Please check if the file exists.`, 'ZIP_FILE_NOT_FOUND', { zipPath })
    this.name = 'ZipFileNotFoundError'
    Object.setPrototypeOf(this, ZipFileNotFoundError.prototype)
  }
}
