import { z } from 'zod'
import { ApiRouteConfig, StepHandler } from 'wistro'

const inputSchema = z.object({})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Start Event',
  description: 'Start the Wistro Server Example flow',
  path: '/api/wistro-server-example',
  method: 'POST',
  emits: ['ws-server-example.start'],
  bodySchema: inputSchema,
  flows: ['wistro-server'],
}

export const handler: StepHandler<typeof config> = async (_, { emit, logger }) => {
  logger.info('[Wistro Server Example] start-event')

  await emit({
    type: 'ws-server-example.start',
    data: { message: 'The flow has been started!' },
  })

  return {
    status: 200,
    body: { message: 'The flow has been started!' },
  }
}
