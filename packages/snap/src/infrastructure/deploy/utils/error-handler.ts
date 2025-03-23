import { AxiosError } from 'axios'
import { logger } from '../logger'
import { DeploymentError, FailedUpload } from '../error'

export const formatError = (error: unknown): string => {
  if (error instanceof DeploymentError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

export const handleAxiosError = (error: AxiosError, operation: string): Error => {
  const errorCode = error.code || 'UNKNOWN'
  const statusCode = error.response?.status
  const responseData = error.response?.data ? JSON.stringify(error.response.data) : ''

  const errorMap: Record<string, string> = {
    ECONNREFUSED: 'Connection refused: Unable to connect to the API server',
    ENOTFOUND: 'Host not found: Please check your network connection and the API URL',
    ETIMEDOUT: 'Connection timed out: The server took too long to respond',
  }

  if (errorCode in errorMap) {
    return new Error(errorMap[errorCode])
  }

  if (statusCode) {
    if (statusCode === 401 || statusCode === 403) {
      return new Error(
        `Authentication error (${statusCode}): Invalid API key or insufficient permissions. ${responseData}`,
      )
    } else if (statusCode === 404) {
      return new Error(`Not found error (${statusCode}): The API endpoint was not found. ${responseData}`)
    } else if (statusCode === 413) {
      return new Error(
        `Payload too large (${statusCode}): The ${operation} exceeds the maximum allowed size. ${responseData}`,
      )
    } else if (statusCode >= 500) {
      return new Error(`Server error (${statusCode}): The API server encountered an error. ${responseData}`)
    } else {
      return new Error(`API request failed with status ${statusCode}: ${error.response?.statusText}. ${responseData}`)
    }
  }

  return new Error(`Request error during ${operation}: ${error.message}`)
}

export const logFailures = (failedUploads: FailedUpload[], totalCount: number): void => {
  logger.error(`${failedUploads.length} of ${totalCount} files failed to upload. Deployment aborted.`)

  failedUploads.forEach((failure, index) => {
    logger.error(`${index + 1}. ${failure.name} (${failure.type}) - ${failure.path}: ${failure.error}`)
  })
}
