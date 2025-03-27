export type DeploymentStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface Deployment {
  id: string
  stageId: string
  version: string
  status: DeploymentStatus
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
  errorMessage?: string
  output?: string
}

export interface DeploymentConfig {
  config: Record<string, unknown>
  version: string
} 