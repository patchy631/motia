import { Stage } from '../entities/stage'

export interface StageListResponse {
  stages: Stage[]
}

export interface StageResponse extends Stage {} 