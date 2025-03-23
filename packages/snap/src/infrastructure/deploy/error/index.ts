export { DeploymentError } from './deployment-error'
export { EmptyStepsConfigError } from './empty-steps-config-error'
export { NoZipFilesError } from './no-zip-files-error'
export { ZipFileNotFoundError } from './zip-file-not-found-error'
export { UploadFailureError } from './upload-failure-error'
export { ConfigUploadFailureError } from './config-upload-failure-error'
export { DeploymentFailureError } from './deployment-failure-error'
export { GenericDeploymentError } from './from-error'
export { MissingApiKeyError } from './missing-api-key-error'
export { MissingStepsConfigError } from './missing-steps-config-error'

export interface FailedUpload {
  path: string
  name: string
  type: string
  error: string
}
