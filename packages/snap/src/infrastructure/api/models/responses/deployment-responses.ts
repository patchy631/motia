export interface DeploymentStartResponse {
  message: string
  deploymentId: string
  clientId: string
  version: string
  status: string
  apiGatewayUrl: string
}

export interface DeploymentStatusResponse {
  status: string
  output?: string
  errorMessage?: string
}

export interface DeploymentListResponse {
  deployments: Array<{
    id: string
    version: string
    status: string
    createdAt: string
    updatedAt: string
  }>
} 