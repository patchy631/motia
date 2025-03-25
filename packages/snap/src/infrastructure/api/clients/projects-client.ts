import { HttpClient } from '../core/http-client'
import { Project } from '../models/project'
import { ENDPOINTS } from '../core/api-constants'

export class ProjectsClient extends HttpClient {
  async createProject(name: string, description?: string): Promise<Project> {
    return this.request<Project>(ENDPOINTS.PROJECTS, 'POST', {
      name,
      description
    })
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>(ENDPOINTS.PROJECTS)
  }

  async getProject(projectId: string): Promise<Project> {
    return this.request<Project>(`${ENDPOINTS.PROJECTS}/${projectId}`)
  }

  async updateProject(
    projectId: string, 
    data: { name?: string; description?: string }
  ): Promise<Project> {
    return this.request<Project>(`${ENDPOINTS.PROJECTS}/${projectId}`, 'PATCH', data)
  }

  async deleteProject(projectId: string): Promise<void> {
    return this.request<void>(`${ENDPOINTS.PROJECTS}/${projectId}`, 'DELETE')
  }
} 