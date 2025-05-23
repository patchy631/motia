import { isApiStep } from '../guards'
import { LockedData } from '../locked-data'
import { StateStream } from '../state-stream'
import { ApiRouteConfig, ApiRouteMethod, Step } from '../types'
import { JsonSchema } from '../types/schema.types'

type QueryParam = {
  name: string
  description: string
}

type ApiEndpoint = {
  id: string
  method: ApiRouteMethod
  path: string
  description?: string
  queryParams?: QueryParam[]
  responseSchema?: JsonSchema
  bodySchema?: JsonSchema
}

const mapEndpoint = (step: Step<ApiRouteConfig>): ApiEndpoint => {
  return {
    id: step.filePath,
    method: step.config.method,
    path: step.config.path,
    description: step.config.description,
    queryParams: step.config.queryParams,
    responseSchema: step.config.responseSchema as never as JsonSchema,
    bodySchema: step.config.bodySchema as never as JsonSchema,
  }
}

class ApiEndpointsStream extends StateStream<ApiEndpoint> {
  constructor(private readonly lockedData: LockedData) {
    super()
  }

  async get(id: string): Promise<ApiEndpoint | null> {
    const endpoint = this.lockedData.apiSteps().find((step) => step.config.path === id)
    return endpoint ? mapEndpoint(endpoint) : null
  }

  async update(_: string, data: ApiEndpoint): Promise<ApiEndpoint> {
    return data
  }

  async delete(id: string): Promise<ApiEndpoint> {
    return { id } as never
  }

  async create(_: string, data: ApiEndpoint): Promise<ApiEndpoint> {
    return data
  }

  async getList(): Promise<ApiEndpoint[]> {
    return this.lockedData.apiSteps().map(mapEndpoint)
  }

  getGroupId(): string {
    /**
     * We're making it static to default because we only have one group of api endpoints
     *
     * In the future, we might want to have group of endpoints by Flows
     */
    return 'default'
  }
}

export const apiEndpoints = (lockedData: LockedData) => {
  const stream = lockedData.createStream({
    filePath: '__motia.api-endpoints.ts',
    hidden: true,
    config: {
      name: '__motia.api-endpoints',
      baseConfig: { storageType: 'custom', factory: () => new ApiEndpointsStream(lockedData) },
      schema: null as never,
    },
  })()

  const apiStepCreated = (step: Step) => {
    if (isApiStep(step)) {
      stream.create(step.filePath, {
        id: step.filePath,
        method: step.config.method,
        path: step.config.path,
        description: step.config.description,
        queryParams: step.config.queryParams,
      })
    }
  }

  const apiStepUpdated = (step: Step) => {
    if (isApiStep(step)) {
      stream.update(step.filePath, mapEndpoint(step))
    }
  }

  const apiStepRemoved = (step: Step) => {
    if (isApiStep(step)) {
      stream.delete(step.filePath)
    }
  }

  lockedData.onStep('step-created', apiStepCreated)
  lockedData.onStep('step-updated', apiStepUpdated)
  lockedData.onStep('step-removed', apiStepRemoved)
}
