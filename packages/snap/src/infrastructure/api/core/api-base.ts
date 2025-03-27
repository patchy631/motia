export interface ApiErrorResponse {
  status: number
  message: string
  details?: string
  code?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: string
  readonly code?: string

  constructor(error: ApiErrorResponse) {
    super(error.message)
    this.name = 'ApiError'
    this.status = error.status
    this.details = error.details
    this.code = error.code
  }
}

export class NetworkError extends ApiError {
  constructor(error: Error) {
    super({
      status: 0,
      message: 'Network Error',
      details: error.message,
      code: 'NETWORK_ERROR'
    })
    this.name = 'NetworkError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super({
      status: 401,
      message,
      code: 'UNAUTHORIZED'
    })
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super({
      status: 403,
      message,
      code: 'FORBIDDEN'
    })
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super({
      status: 404,
      message: `${resource} not found`,
      code: 'NOT_FOUND'
    })
    this.name = 'NotFoundError'
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiErrorResponse
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
      ...additionalHeaders,
    }
  }

  protected getUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`
  }

  protected handleApiError(error: unknown): never {
    if (error instanceof ApiError) {
      throw error
    }

    if ((error as ApiErrorResponse).status) {
      const apiError = error as ApiErrorResponse
      switch (apiError.status) {
        case 401:
          throw new UnauthorizedError(apiError.message)
        case 403:
          throw new ForbiddenError(apiError.message)
        case 404:
          throw new NotFoundError(apiError.message)
        default:
          throw new ApiError(apiError)
      }
    }

    throw new NetworkError(error as Error)
  }

  protected buildApiError(status: number, message: string, details?: string, code?: string): ApiError {
    return new ApiError({
      status,
      message,
      details,
      code
    })
  }
}
