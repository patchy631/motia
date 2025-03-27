import { ApiBase, ApiResponse } from './api-base'
import { API_BASE_URL } from './api-constants'

export class HttpClient extends ApiBase {
  constructor(apiKey: string, baseUrl: string = API_BASE_URL) {
    super(apiKey, baseUrl)
  }

  protected async request<T>(endpoint: string, method: string = 'GET', body?: Record<string, unknown>): Promise<T> {
    const url = this.getUrl(endpoint)

    try {
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(url, options)
      const data = await response.json()

      if (!response.ok) {
        throw this.buildApiError(
          response.status,
          response.statusText || 'Request failed',
          data.error?.message || data.error?.details || data.message,
        )
      }

      return data
    } catch (error) {
      return this.handleApiError(error)
    }
  }
}
