import fs from 'fs'
import path from 'path'
import { AxiosClient } from '../core/axios-client'
import { ENDPOINTS, MAX_UPLOAD_SIZE } from '../core/api-constants'
import { Deployment, DeploymentConfig } from '../models/deployment'
import { ZipFileNotFoundError, EmptyStepsConfigError, GenericDeploymentError } from '../../deploy/error'
import { logger } from '../../deploy/logger'
import axios from 'axios'

export class DeploymentsClient extends AxiosClient {
  async uploadStepsConfig(
    stepsConfig: Record<string, unknown>,
    stageId: string = 'dev',
    version: string = 'latest',
  ): Promise<string> {
    if (!stepsConfig || Object.keys(stepsConfig).length === 0) {
      throw new EmptyStepsConfigError()
    }

    const data: DeploymentConfig = {
      config: stepsConfig,
      version,
    }

    const response = await this.makeRequest<{ deploymentId: string }>(
      `${ENDPOINTS.STAGES}/${stageId}/deployments`,
      'POST',
      data,
    )

    return response.deploymentId
  }

  async uploadZipFile(zipPath: string, deploymentId: string): Promise<string> {
    if (!fs.existsSync(zipPath)) {
      throw new ZipFileNotFoundError(zipPath)
    }

    logger.info(`Uploading zip file: ${path.basename(zipPath)}`)

    const fileStats = fs.statSync(zipPath)
    const fileName = path.basename(zipPath)

    const response = await this.makeRequest<{
      uploadId: string
      presignedUrl: string
    }>(`${ENDPOINTS.DEPLOYMENTS}/${deploymentId}/files`, 'POST', {
      originalName: fileName,
      size: fileStats.size,
      mimetype: 'application/zip',
    })

    const { uploadId, presignedUrl } = response

    try {
      const fileStream = fs.createReadStream(zipPath)

      await axios.put(presignedUrl, fileStream, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Length': fileStats.size,
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
        maxContentLength: MAX_UPLOAD_SIZE,
        maxBodyLength: MAX_UPLOAD_SIZE,
      })

      logger.info(`Successfully uploaded ${fileName} to S3`)
    } catch (error) {
      throw new GenericDeploymentError(error, 'FILE_UPLOAD_ERROR', `Failed to upload zip file ${zipPath} to S3`)
    }

    return uploadId
  }

  async startDeployment(deploymentId: string): Promise<void> {
    await this.makeRequest<void>(`${ENDPOINTS.DEPLOYMENTS}/${deploymentId}/start`, 'POST')
  }

  async getDeployment(deploymentId: string): Promise<Deployment> {
    return this.makeRequest<Deployment>(`${ENDPOINTS.DEPLOYMENTS}/${deploymentId}`, 'GET')
  }

  async getDeployments(stageId: string): Promise<Deployment[]> {
    return this.makeRequest<Deployment[]>(`${ENDPOINTS.STAGES}/${stageId}/deployments`, 'GET')
  }

  async getDeploymentStatus(deploymentId: string): Promise<{ status: string; errorMessage?: string; output?: string }> {
    const deployment = await this.getDeployment(deploymentId)
    return {
      status: deployment.status,
      errorMessage: deployment.errorMessage,
      output: deployment.output,
    }
  }
}
