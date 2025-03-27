export interface CreateStageRequest {
  name: string
  description?: string
  projectId: string
  apiUrl?: string
}

export interface UpdateStageRequest {
  name?: string
  description?: string
  apiUrl?: string
} 