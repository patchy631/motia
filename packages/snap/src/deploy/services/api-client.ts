import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'
import { logger } from '../logger'
import { DeploymentError, ZipFileNotFoundError, EmptyStepsConfigError, GenericDeploymentError } from '../error'
import { handleAxiosError } from '../utils/error-handler'

export const API_URL = 'https://api.motiadev.com/deploy'

export class ApiClient {
  private readonly apiKey: string
  private readonly apiUrl: string

  constructor(apiKey: string, apiUrl: string = API_URL) {
    this.apiKey = apiKey
    this.apiUrl = apiUrl
  }

  private async makeApiRequest<T, D = unknown>(
    url: string,
    data: D,
    headers: Record<string, string>,
    operation: string,
    options: {
      timeout?: number
      maxContentLength?: number
      maxBodyLength?: number
    } = {},
  ): Promise<T> {
    try {
      const response = await axios.post<T>(url, data, {
        headers,
        timeout: options.timeout || 30000,
        ...options,
      })

      if (response.status >= 200 && response.status < 300) {
        return response.data
      } else {
        throw new DeploymentError(`API responded with status ${response.status}: ${response.statusText}`, 'API_ERROR', {
          response: response.data,
        })
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw handleAxiosError(error, operation)
      }
      throw error
    }
  }

  async uploadZipFile(
    zipPath: string,
    deploymentId: string,
  ): Promise<string> {
    if (!fs.existsSync(zipPath)) {
      throw new ZipFileNotFoundError(zipPath)
    }

    logger.info(`Uploading zip file: ${path.basename(zipPath)}`)

    const formData = new FormData()

    try {
      formData.append('file', fs.createReadStream(zipPath), {
        filename: path.basename(zipPath),
        contentType: 'application/zip',
      })
    } catch (error) {
      throw new GenericDeploymentError(error, 'FILE_READ_ERROR', `Failed to read zip file ${zipPath}`)
    }

    formData.append('deploymentId', deploymentId)

    const headers: Record<string, string> = {
      ...formData.getHeaders(),
      'x-api-key': this.apiKey,
    }

    const response = await this.makeApiRequest<{ uploadId: string }>(
      `${this.apiUrl}/deployments/${deploymentId}/files`,
      formData,
      headers,
      'zip file',
      {
        maxContentLength: 50 * 1024 * 1024, // 50MB max file size
        maxBodyLength: 50 * 1024 * 1024, // 50MB max body size
      },
    )

    return response.uploadId || `upload-${Date.now()}`
  }

  async uploadStepsConfig(
    stepsConfig: { [key: string]: unknown },
    stageId: string = 'dev',
    version: string = 'latest',
  ): Promise<string> {
    if (!stepsConfig || Object.keys(stepsConfig).length === 0) {
      throw new EmptyStepsConfigError()
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    }

    const data = {
      config: stepsConfig,
      version,
    }

    const response = await this.makeApiRequest<{ deploymentId: string }>(
      `${this.apiUrl}/stages/${stageId}/deployments`,
      data,
      headers,
      'configuration',
    )

    return response.deploymentId
  }

  async startDeployment(deploymentId: string): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    }

    await this.makeApiRequest<void>(`${this.apiUrl}/deployments/${deploymentId}/start`, {}, headers, 'deployment finalization')
  }
}
