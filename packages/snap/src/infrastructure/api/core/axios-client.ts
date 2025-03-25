import axios from 'axios'
import { ApiBase } from './api-base'
import { API_BASE_URL, DEFAULT_TIMEOUT } from './api-constants'

export class AxiosClient extends ApiBase {
  constructor(apiKey: string, baseUrl: string = API_BASE_URL) {
    super(apiKey, baseUrl)
  }

  protected async makeRequest<T, D = unknown>(
    endpoint: string,
    method: string = 'POST',
    data?: D,
    additionalHeaders: Record<string, string> = {},
    options: {
      timeout?: number
      maxContentLength?: number
      maxBodyLength?: number
    } = {},
  ): Promise<T> {
    try {
      const url = this.getUrl(endpoint)
      const headers = this.getHeaders(additionalHeaders)
      
      const response = await axios({
        method,
        url,
        data,
        headers,
        timeout: options.timeout || DEFAULT_TIMEOUT,
        ...options,
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw this.buildApiError(
          error.response?.status || 0,
          error.message,
          error.response?.data?.error || error.response?.data?.message || error.response?.statusText
        )
      }
      return this.handleApiError(error)
    }
  }
} 