import { Project } from '../entities/project'

export interface ProjectListResponse {
  projects: Project[]
}

export interface ProjectResponse extends Project {} 