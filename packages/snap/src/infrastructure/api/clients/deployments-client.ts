import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { AxiosClient } from '../core/axios-client'
import { ENDPOINTS, MAX_UPLOAD_SIZE } from '../core/api-constants'
import { Deployment, DeploymentConfig } from '../models/entities/deployment'
import { ApiError } from '../core/api-base'
import { logger } from '../../deploy/logger'
import {
  DeploymentError,
  DeploymentNotFoundError,
  DeploymentStartError,
  FileUploadError,
  InvalidConfigError,
  VersionPromotionError
} from '../models/errors/deployment-errors'
import { DeploymentStartResponse } from '../models/responses/deployment-responses'

export class DeploymentsClient extends AxiosClient {
  async uploadStepsConfig(
    stepsConfig: Record<string, unknown>,
    stageId = 'dev',
    version = 'latest',
  ): Promise<string> {
    if (!stepsConfig || Object.keys(stepsConfig).length === 0) {
      throw new InvalidConfigError()
    }

    try {
      const response = await this.makeRequest<{ deploymentId: string }>(
        `${ENDPOINTS.STAGES}/${stageId}/deployments`,
        'POST',
        { config: stepsConfig, version }
      )
      return response.deploymentId
    } catch (error) {
      if (error instanceof ApiError) {
        throw new DeploymentError(
          error.message,
          error.details,
          error.code
        )
      }
      throw error
    }
  }

  async uploadZipFile(zipPath: string, deploymentId: string): Promise<string> {
    if (!fs.existsSync(zipPath)) {
      throw new FileUploadError(new Error('File not found'), zipPath)
    }

    const fileName = path.basename(zipPath)
    const fileStats = fs.statSync(zipPath)

    try {
      const { uploadId, presignedUrl } = await this.makeRequest<{
        uploadId: string
        presignedUrl: string
      }>(`${ENDPOINTS.DEPLOYMENTS}/${deploymentId}/files`, 'POST', {
        originalName: fileName,
        size: fileStats.size,
        mimetype: 'application/zip',
      })

      await this.uploadToPresignedUrl(zipPath, presignedUrl, fileStats.size)
      return uploadId
    } catch (error) {
      logger.error(`Failed to upload bundle: ${error instanceof Error ? error.message : String(error)}`)
      throw new FileUploadError(error, zipPath)
    }
  }

  async startDeployment(deploymentId: string, envData: Record<string, string> = {}): Promise<DeploymentStartResponse> {
    try {
      return await this.makeRequest<DeploymentStartResponse>(
        `${ENDPOINTS.DEPLOYMENTS}/${deploymentId}/start`,
        'POST',
        { environmentVariables: envData }
      )
    } catch (error) {
      throw error instanceof ApiError 
        ? new DeploymentStartError(deploymentId, error)
        : error
    }
  }

  async promoteVersion(stageId: string, version: string): Promise<void> {
    try {
      await this.makeRequest<void>(`${ENDPOINTS.STAGES}/${stageId}/${version}/promote`, 'POST')
    } catch (error) {
      throw error instanceof ApiError 
        ? new VersionPromotionError(version, stageId, error)
        : error
    }
  }

  async getDeployment(deploymentId: string): Promise<Deployment> {
    try {
      return await this.makeRequest<Deployment>(`${ENDPOINTS.DEPLOYMENTS}/${deploymentId}`, 'GET')
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new DeploymentNotFoundError(deploymentId)
        }
        throw new DeploymentError(
          error.message,
          error.details,
          error.code
        )
      }
      throw error
    }
  }

  async getDeployments(stageId: string): Promise<Deployment[]> {
    try {
      return await this.makeRequest<Deployment[]>(`${ENDPOINTS.STAGES}/${stageId}/deployments`, 'GET')
    } catch (error) {
      if (error instanceof ApiError) {
        throw new DeploymentError(
          error.message,
          error.details,
          error.code
        )
      }
      throw error
    }
  }

  async getDeploymentStatus(deploymentId: string): Promise<{ status: string; errorMessage?: string; output?: string }> {
    try {
      const deployment = await this.getDeployment(deploymentId)
      return {
        status: deployment.status,
        errorMessage: deployment.errorMessage,
        output: deployment.output,
      }
    } catch (error) {
      if (error instanceof DeploymentNotFoundError) {
        throw error
      }
      if (error instanceof ApiError) {
        throw new DeploymentError(
          error.message,
          error.details,
          error.code
        )
      }
      throw error
    }
  }

  private async uploadToPresignedUrl(filePath: string, presignedUrl: string, fileSize: number): Promise<void> {
    const fileName = path.basename(filePath)
    const fileStream = fs.createReadStream(filePath)

    await axios.put(presignedUrl, fileStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': fileSize,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
      maxContentLength: MAX_UPLOAD_SIZE,
      maxBodyLength: MAX_UPLOAD_SIZE,
    })

    logger.info(`Successfully uploaded ${fileName} to S3`)
  }
}
