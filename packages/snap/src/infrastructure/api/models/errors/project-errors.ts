import { ApiError } from '../../core/api-base'

export class ProjectError extends ApiError {
  constructor(message: string, details?: string, code = 'PROJECT_ERROR') {
    super({
      status: 500,
      message,
      details,
      code
    })
    this.name = 'ProjectError'
  }
}

export class ProjectNotFoundError extends ProjectError {
  constructor(projectId: string) {
    super(
      `Project ${projectId} not found`,
      'The specified project does not exist or has been deleted',
      'PROJECT_NOT_FOUND'
    )
    this.name = 'ProjectNotFoundError'
  }
}

export class DuplicateProjectError extends ProjectError {
  constructor(projectName: string) {
    super(
      `Project with name "${projectName}" already exists`,
      'Project names must be unique',
      'DUPLICATE_PROJECT'
    )
    this.name = 'DuplicateProjectError'
  }
} 