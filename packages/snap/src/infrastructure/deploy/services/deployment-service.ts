import { UploadResult, ZipFileInfo } from '../types'
import { ApiClient } from './api-client'
import { logger } from '../logger'
import { ConfigUploadFailureError, DeploymentFailureError, FailedUpload } from '../error'
import { formatError, logFailures } from '../utils/error-handler'

export class DeploymentService {
  private readonly apiClient: ApiClient

  constructor(private readonly apiKey: string) {
    this.apiClient = new ApiClient(this.apiKey)
  }

  async uploadConfiguration(
    stepsConfig: { [key: string]: unknown },
    stageId: string,
    version: string,
  ): Promise<string> {
    try {
      logger.info('Uploading configuration...')
      const deploymentId = await this.apiClient.uploadStepsConfig(stepsConfig,  stageId, version)
      logger.success('Configuration uploaded successfully')
      logger.success(`Deployment started with ID: ${deploymentId}`)
      return deploymentId
    } catch (error) {
      const errorMessage = formatError(error)
      logger.error(`Failed to upload steps configuration: ${errorMessage}`)
      throw new ConfigUploadFailureError(errorMessage)
    }
  }

  async uploadZipFiles(
    zipFiles: ZipFileInfo[],
    deploymentId: string,
  ): Promise<{
    uploadResults: UploadResult[]
    failedUploads: FailedUpload[]
    allSuccessful: boolean
  }> {
    logger.info('Uploading zip files...')

    let allSuccessful = true
    const uploadResults: UploadResult[] = []
    const failedUploads: FailedUpload[] = []

    for (const zipFile of zipFiles) {
      try {
        const uploadId = await this.apiClient.uploadZipFile(
          zipFile.zipPath,
          deploymentId,
        )

        uploadResults.push({
          bundlePath: zipFile.bundlePath,
          uploadId,
          stepType: zipFile.config.type,
          stepName: zipFile.stepName,
          success: true,
        })

        logger.success(`Uploaded ${zipFile.bundlePath}`)
      } catch (error) {
        allSuccessful = false
        const errorMessage = formatError(error)

        logger.error(`Failed to upload ${zipFile.bundlePath}: ${errorMessage}`)

        failedUploads.push({
          path: zipFile.bundlePath,
          name: zipFile.stepName,
          type: zipFile.config.type,
          error: errorMessage,
        })

        uploadResults.push({
          bundlePath: zipFile.bundlePath,
          stepType: zipFile.config.type,
          stepName: zipFile.stepName,
          error: errorMessage,
          success: false,
        })
      }
    }

    if (allSuccessful) {
      logger.success(`All ${zipFiles.length} zip files uploaded successfully`)
    } else {
      logFailures(failedUploads, zipFiles.length)
    }

    return {
      uploadResults,
      failedUploads,
      allSuccessful,
    }
  }

  async startDeployment(deploymentId: string): Promise<void> {
    try {
      logger.info('Finalizing deployment...')
      await this.apiClient.startDeployment(deploymentId)
    } catch (error) {
      const errorMessage = formatError(error)
      logger.error(`Failed to finalize deployment: ${errorMessage}`)
      throw new DeploymentFailureError(errorMessage)
    }
  }
}

