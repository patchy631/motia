import path from 'path'
import { ApiError, ApiFactory, DeploymentsClient } from '../../api'
import { ConfigUploadFailureError, DeploymentFailureError } from '../error'
import { logger } from '../logger'
import { UploadResult } from '../types'
import { formatError } from '../utils/error-handler'
import { fileManager } from '../file-manager'
import { DeploymentStartResponse } from '../../api/models/responses/deployment-responses'

export class DeploymentService {
  private readonly deploymentClient: DeploymentsClient

  constructor(apiKey: string, apiUrl?: string) {
    const apiFactory = new ApiFactory(apiKey, apiUrl)
    this.deploymentClient = apiFactory.getDeploymentsClient()
  }

  async uploadConfiguration(
    stepsConfig: { [key: string]: unknown },
    stageId: string,
    version: string,
  ): Promise<string> {
    try {
      logger.info('Uploading configuration...')
      const deploymentId = await this.deploymentClient.uploadStepsConfig(stepsConfig, stageId, version)
      logger.success('Configuration uploaded successfully')
      logger.success(`Deployment started with ID: ${deploymentId}`)
      return deploymentId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const details = error instanceof ApiError ? error.details : undefined
      logger.error(`Failed to upload steps configuration: ${errorMessage}${details ? `\nDetails: ${details}` : ''}`)
      throw new ConfigUploadFailureError(errorMessage)
    }
  }

  async uploadZipFile(deploymentId: string, distDir: string): Promise<UploadResult> {
    logger.info('Uploading zip file...')

    const { filePath, cleanup } = await fileManager.createDeployableZip(deploymentId, distDir)

    const uploadResult: UploadResult = {
      bundlePath: filePath,
      uploadId: '',
      stepType: 'zip',
      stepName: path.basename(filePath),
      success: true,
    }

    try {
      const uploadId = await this.deploymentClient.uploadZipFile(filePath, deploymentId)

      uploadResult.uploadId = uploadId

      logger.success(`Uploaded bundle successfully`)
    } catch (error) {
      const errorMessage = formatError(error)

      logger.error(`Failed to upload bundle: ${errorMessage}`)

      uploadResult.error = errorMessage
      uploadResult.success = false
    } finally {
      cleanup()
    }

    return uploadResult
  }

  async startDeployment(deploymentId: string, envData?: Record<string, string>): Promise<DeploymentStartResponse> {
    try {
      logger.info('Finalizing deployment...')
      return this.deploymentClient.startDeployment(deploymentId, envData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const details = error instanceof ApiError ? error.details : undefined
      logger.error(`Failed to finalize deployment: ${errorMessage}${details ? `\nDetails: ${details}` : ''}`)
      throw new DeploymentFailureError(errorMessage)
    }
  }

  async getDeploymentStatus(deploymentId: string): Promise<{ status: string; errorMessage?: string; output?: string }> {
    try {
      return await this.deploymentClient.getDeploymentStatus(deploymentId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const details = error instanceof ApiError ? error.details : undefined
      logger.error(`Failed to check deployment status: ${errorMessage}${details ? `\nDetails: ${details}` : ''}`)
      throw new DeploymentFailureError(`Failed to check deployment status: ${errorMessage}`)
    }
  }

  async promoteVersion(stageId: string, version: string): Promise<void> {
    try {
      logger.info(`Promoting version ${version} to stage ${stageId}...`)
      await this.deploymentClient.promoteVersion(stageId, version)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const details = error instanceof ApiError ? error.details : undefined
      logger.error(`Failed to promote version: ${errorMessage}${details ? `\nDetails: ${details}` : ''}`)
      throw new DeploymentFailureError(`Failed to promote version: ${errorMessage}`)
    }
  }
}
