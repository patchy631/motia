import { API_BASE_URL } from './core/api-constants'
import { ProjectsClient } from './clients/projects-client'
import { StagesClient } from './clients/stages-client'
import { DeploymentsClient } from './clients/deployments-client'

export class ApiFactory {
  private readonly apiKey: string
  private readonly baseUrl: string

  private projectsClient?: ProjectsClient
  private stagesClient?: StagesClient
  private deploymentsClient?: DeploymentsClient

  constructor(apiKey: string, baseUrl: string = API_BASE_URL) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  public getProjectsClient(): ProjectsClient {
    if (!this.projectsClient) {
      this.projectsClient = new ProjectsClient(this.apiKey, this.baseUrl)
    }
    return this.projectsClient
  }

  public getStagesClient(): StagesClient {
    if (!this.stagesClient) {
      this.stagesClient = new StagesClient(this.apiKey, this.baseUrl)
    }
    return this.stagesClient
  }

  public getDeploymentsClient(): DeploymentsClient {
    if (!this.deploymentsClient) {
      this.deploymentsClient = new DeploymentsClient(this.apiKey, this.baseUrl)
    }
    return this.deploymentsClient
  }
} 