import { ApiError } from '../../core/api-base'

export class StageError extends ApiError {
  constructor(message: string, details?: string, code = 'STAGE_ERROR') {
    super({
      status: 500,
      message,
      details,
      code
    })
    this.name = 'StageError'
  }
}

export class StageNotFoundError extends StageError {
  constructor(stageId: string) {
    super(
      `Stage ${stageId} not found`,
      'The specified stage does not exist or has been deleted',
      'STAGE_NOT_FOUND'
    )
    this.name = 'StageNotFoundError'
  }
}

export class DuplicateStageError extends StageError {
  constructor(stageName: string, projectId: string) {
    super(
      `Stage with name "${stageName}" already exists in project ${projectId}`,
      'Stage names must be unique within a project',
      'DUPLICATE_STAGE'
    )
    this.name = 'DuplicateStageError'
  }
} 