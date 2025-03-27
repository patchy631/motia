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
      const contentType = response.headers.get('content-type')
      const data = contentType?.includes('application/json') ? await response.json() : await response.text()

      if (!response.ok) {
        throw this.buildApiError(
          response.status,
          data.error?.message || data.message || response.statusText || 'Request failed',
          data.error?.details || data.details,
          data.error?.code || `HTTP_${response.status}`
        )
      }

      return data as T
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.buildApiError(408, 'Request timeout', error.message, 'REQUEST_TIMEOUT')
      }
      return this.handleApiError(error)
    }
  }
}
