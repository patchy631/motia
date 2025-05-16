import { Express, Response } from 'express'
import { Server as SocketIOServer } from 'socket.io'
import { isApiStep } from './guards'
import { LockedData } from './locked-data'
import { ApiRouteMethod, Step } from './types'
import { JsonSchema } from './types/schema.types'

type QueryParam = {
  name: string
  description: string
}

type ApiEndpoint = {
  method: ApiRouteMethod
  path: string
  description?: string
  queryParams?: QueryParam[]
  responseSchema?: JsonSchema
  bodySchema?: JsonSchema
}

export const apiEndpoints = (lockedData: LockedData, app: Express, io: SocketIOServer) => {
  const apiStepChange = (step: Step) => {
    if (isApiStep(step)) io.emit('api-endpoint-changed')
  }

  lockedData.onStep('step-created', apiStepChange)
  lockedData.onStep('step-updated', apiStepChange)
  lockedData.onStep('step-removed', apiStepChange)

  app.get('/api-endpoints', (_, res: Response) => {
    const endpoints: ApiEndpoint[] = lockedData.apiSteps().map((step) => ({
      method: step.config.method,
      path: step.config.path,
      description: step.config.description,
      queryParams: step.config.queryParams,
      responseSchema: step.config.responseSchema as never as JsonSchema,
      bodySchema: step.config.bodySchema as never as JsonSchema,
    }))

    res.status(200).send(endpoints)
  })
}
