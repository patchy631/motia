export interface CreateDeploymentRequest {
  stageId: string
  version: string
  config: Record<string, unknown>
}

export interface UpdateDeploymentRequest {
  status?: string
  output?: string
  errorMessage?: string
}

export interface PromoteDeploymentRequest {
  targetStageId: string
  version: string
} 