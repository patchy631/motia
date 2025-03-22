import fs from 'fs'
import path from 'path'

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
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string = API_BASE_URL) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    console.log(`Calling API: ${url} (${method})`)

    try {
      const headers: Record<string, string> = {
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

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        const error: ApiError = {
          status: response.status,
          message: response.statusText,
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

  async getProject(projectId: string): Promise<Project> {
    return this.request<Project>(`/projects/${projectId}`)
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

  async getStages(projectId?: string): Promise<Stage[]> {
    return this.request<Stage[]>(`/projects/${projectId}/stages`)
  }

} 