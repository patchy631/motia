import { HttpClient } from '../core/http-client'
import { Stage } from '../models/stage'
import { ENDPOINTS } from '../core/api-constants'

export class StagesClient extends HttpClient {
  async createStage(name: string, projectId: string, description?: string): Promise<Stage> {
    return this.request<Stage>(`${ENDPOINTS.PROJECTS}/${projectId}/stages`, 'POST', {
      name,
      description,
    })
  }

  async getStages(projectId: string): Promise<Stage[]> {
    return this.request<Stage[]>(`${ENDPOINTS.PROJECTS}/${projectId}/stages`)
  }

  async getStage(projectId: string, stageId: string): Promise<Stage> {
    return this.request<Stage>(`${ENDPOINTS.PROJECTS}/${projectId}/stages/${stageId}`)
  }

  async updateStage(projectId: string, stageId: string, data: { name?: string; description?: string }): Promise<Stage> {
    return this.request<Stage>(`${ENDPOINTS.PROJECTS}/${projectId}/stages/${stageId}`, 'PATCH', data)
  }

  async deleteStage(projectId: string, stageId: string): Promise<void> {
    return this.request<void>(`${ENDPOINTS.PROJECTS}/${projectId}/stages/${stageId}`, 'DELETE')
  }
}
