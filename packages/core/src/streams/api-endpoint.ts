import { JsonSchema } from '../types/schema.types'
import { ApiRouteConfig, ApiRouteMethod, IStateStream, QueryParam, Step } from '../types'

export type ApiEndpoint = {
  id: string
  method: ApiRouteMethod
  path: string
  description?: string
  queryParams?: QueryParam[]
  responseSchema?: JsonSchema
  bodySchema?: JsonSchema
}

export class ApiEndpointsStream implements IStateStream<ApiEndpoint> {
  constructor(private readonly list: () => Step<ApiRouteConfig>[]) {}

  private mapEndpoint(step: Step<ApiRouteConfig>): ApiEndpoint {
    return {
      id: `${step.config.method} ${step.config.path}`,
      method: step.config.method,
      path: step.config.path,
      description: step.config.description,
      queryParams: step.config.queryParams,
      responseSchema: step.config.responseSchema as never as JsonSchema,
      bodySchema: step.config.bodySchema as never as JsonSchema,
    }
  }

  async get(id: string): Promise<ApiEndpoint | null> {
    const endpoint = this.list().find((step) => step.config.path === id)
    return endpoint ? this.mapEndpoint(endpoint) : null
  }

  async update(_: string, data: ApiEndpoint): Promise<ApiEndpoint> {
    return data
  }

  async delete(id: string): Promise<ApiEndpoint> {
    return (await this.get(id))!
  }

  async create(_: string, data: ApiEndpoint): Promise<ApiEndpoint> {
    return data
  }

  async getList(_: string): Promise<ApiEndpoint[]> {
    return this.list().map(this.mapEndpoint)
  }

  getGroupId(_: ApiEndpoint): string {
    return 'default'
  }
}
