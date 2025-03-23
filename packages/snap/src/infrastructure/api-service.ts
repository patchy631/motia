export const API_BASE_URL = 'http://localhost:3000'

export interface Project {
  id: string
  name: string
  description?: string
}

export interface Stage {
  id: string
  name: string
  description?: string
  projectId: string
  apiUrl?: string
}

export interface ApiError {
  status: number
  message: string
  details?: string
}

export class ApiService {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(apiKey: string, baseUrl: string = API_BASE_URL) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }

      const options: RequestInit = {
        method,
        headers
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(url, options)

      let data: any = {}
      const text = await response.text()
      
      if (text) {
        try {
          data = JSON.parse(text)
        } catch (e) {
          // If response is not valid JSON, keep the text version
          data = { message: text }
        }
      }

      if (!response.ok) {
        const error: ApiError = {
          status: response.status,
          message: response.statusText || 'Request failed',
          details: data.error || data.message || text
        }
        throw error
      }

      return data as T
    } catch (error) {
      if ((error as ApiError).status) {
        throw error
      }
      throw {
        status: 0,
        message: 'Network Error',
        details: (error as Error).message
      } as ApiError
    }
  }

  // Project APIs
  async createProject(
    name: string,
    description?: string
  ): Promise<Project> {
    return this.request<Project>('/projects', 'POST', {
      name,
      description
    })
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects')
  }

  async updateProject(
    projectId: string, 
    data: { name?: string; description?: string }
  ): Promise<Project> {
    return this.request<Project>(`/projects/${projectId}`, 'PATCH', data)
  }

  // Stage APIs
  async createStage(
    name: string,
    projectId: string,
    description?: string
  ): Promise<Stage> {
    return this.request<Stage>(`/projects/${projectId}/stages`, 'POST', {
      name,
      description
    })
  }

  async getStages(projectId: string): Promise<Stage[]> {
    return this.request<Stage[]>(`/projects/${projectId}/stages`)
  }

  async deleteStage(projectId: string, stageId: string): Promise<void> {
    return this.request<void>(`/projects/${projectId}/stages/${stageId}`, 'DELETE')
  }

  async updateStage(
    projectId: string,
    stageId: string,
    data: { name?: string; description?: string }
  ): Promise<Stage> {
    return this.request<Stage>(`/projects/${projectId}/stages/${stageId}`, 'PATCH', data)
  }
} 