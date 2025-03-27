import { HttpClient } from '../core/http-client'
import { Stage } from '../models/entities/stage'
import { ENDPOINTS } from '../core/api-constants'
import { CreateStageRequest, UpdateStageRequest } from '../models/requests/stage-requests'
import { StageResponse, StageListResponse } from '../models/responses/stage-responses'
import { StageNotFoundError, DuplicateStageError, StageError } from '../models/errors/stage-errors'
import { ApiError } from '../core/api-base'

export class StagesClient extends HttpClient {
  async createStage(name: string, projectId: string, description?: string): Promise<Stage> {
    try {
      return await this.request<Stage>(`${ENDPOINTS.PROJECTS}/${projectId}/stages`, 'POST', {
        name,
        description,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          throw new DuplicateStageError(name, projectId)
        }
        throw new StageError(
          'Unable to create stage',
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }

  async getStages(projectId: string): Promise<Stage[]> {
    try {
      return await this.request<Stage[]>(`${ENDPOINTS.PROJECTS}/${projectId}/stages`)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new StageError(
          'Unable to retrieve stages',
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }

  async getStage(projectId: string, stageId: string): Promise<Stage> {
    try {
      return await this.request<Stage>(`${ENDPOINTS.PROJECTS}/${projectId}/stages/${stageId}`)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new StageNotFoundError(stageId)
        }
        throw new StageError(
          `Unable to retrieve stage ${stageId}`,
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }

  async updateStage(projectId: string, stageId: string, data: { name?: string; description?: string }): Promise<Stage> {
    try {
      return await this.request<Stage>(`${ENDPOINTS.PROJECTS}/${projectId}/stages/${stageId}`, 'PATCH', data)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new StageNotFoundError(stageId)
        }
        if (error.status === 409) {
          throw new DuplicateStageError(data.name || '', projectId)
        }
        throw new StageError(
          `Unable to update stage ${stageId}`,
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }

  async deleteStage(projectId: string, stageId: string): Promise<void> {
    try {
      return await this.request<void>(`${ENDPOINTS.PROJECTS}/${projectId}/stages/${stageId}`, 'DELETE')
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new StageNotFoundError(stageId)
        }
        throw new StageError(
          `Unable to delete stage ${stageId}`,
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }
}
