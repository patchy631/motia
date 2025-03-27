import axios, { AxiosError, AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios'
import { ApiBase } from './api-base'
import { API_BASE_URL, DEFAULT_TIMEOUT } from './api-constants'

interface ErrorResponse {
  error?: {
    message?: string
    details?: string
    code?: string
  }
  message?: string
  details?: string
  code?: string
}

export class AxiosClient extends ApiBase {
  constructor(apiKey: string, baseUrl: string = API_BASE_URL) {
    super(apiKey, baseUrl)
  }

  protected async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    data?: unknown,
    config: Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'headers'> & { headers?: RawAxiosRequestHeaders } = {}
  ): Promise<T> {
    const url = this.getUrl(endpoint)

    try {
      const response = await axios({
        url,
        method,
        data,
        headers: this.getHeaders(config.headers as Record<string, string> || {}),
        ...config,
      })

      return response.data as T
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>
        const responseData = axiosError.response?.data || {}

        throw this.buildApiError(
          axiosError.response?.status || 0,
          responseData.error?.message || responseData.message || axiosError.message,
          responseData.error?.details || responseData.details,
          responseData.error?.code || responseData.code || `HTTP_${axiosError.response?.status}`
        )
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw this.buildApiError(408, 'Request timeout', error.message, 'REQUEST_TIMEOUT')
      }

      return this.handleApiError(error)
    }
  }
}
