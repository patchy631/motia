import { HttpClient } from '../core/http-client'
import { Project } from '../models/entities/project'
import { ENDPOINTS } from '../core/api-constants'
import { CreateProjectRequest, UpdateProjectRequest } from '../models/requests/project-requests'
import { ProjectResponse, ProjectListResponse } from '../models/responses/project-responses'
import { ProjectNotFoundError, DuplicateProjectError, ProjectError } from '../models/errors/project-errors'
import { ApiError } from '../core/api-base'

export class ProjectsClient extends HttpClient {
  async createProject(name: string, description?: string): Promise<Project> {
    try {
      return await this.request<Project>(ENDPOINTS.PROJECTS, 'POST', {
        name,
        description,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          throw new DuplicateProjectError(name)
        }
        throw new ProjectError(
          'Unable to create project',
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }

  async getProjects(): Promise<Project[]> {
    try {
      return await this.request<Project[]>(ENDPOINTS.PROJECTS)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ProjectError(
          'Unable to retrieve projects',
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }

  async getProject(projectId: string): Promise<Project> {
    try {
      return await this.request<Project>(`${ENDPOINTS.PROJECTS}/${projectId}`)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new ProjectNotFoundError(projectId)
        }
        throw new ProjectError(
          `Unable to retrieve project ${projectId}`,
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }

  async updateProject(projectId: string, data: { name?: string; description?: string }): Promise<Project> {
    try {
      return await this.request<Project>(`${ENDPOINTS.PROJECTS}/${projectId}`, 'PATCH', data)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new ProjectNotFoundError(projectId)
        }
        if (error.status === 409) {
          throw new DuplicateProjectError(data.name || '')
        }
        throw new ProjectError(
          `Unable to update project ${projectId}`,
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      return await this.request<void>(`${ENDPOINTS.PROJECTS}/${projectId}`, 'DELETE')
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new ProjectNotFoundError(projectId)
        }
        throw new ProjectError(
          `Unable to delete project ${projectId}`,
          `${error.message}${error.details ? `\nDetails: ${error.details}` : ''}`,
          error.code
        )
      }
      throw error
    }
  }
}
