export interface ApiError {
  status: number
  message: string
  details?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export class ApiBase {
  protected readonly apiKey: string
  protected readonly baseUrl: string

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  protected getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...additionalHeaders
    }
  }

  protected getUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`
  }

  protected handleApiError(error: unknown): never {
    if ((error as ApiError).status) {
      throw error
    }
    throw {
      status: 0,
      message: 'Network Error',
      details: (error as Error).message
    } as ApiError
  }

  protected buildApiError(status: number, message: string, details?: string): ApiError {
    return {
      status,
      message,
      details
    }
  }

  protected parseResponseData(text: string): any {
    if (!text) return {}
    
    try {
      return JSON.parse(text)
    } catch (e) {
      return { message: text }
    }
  }
} 