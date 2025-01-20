import { z } from 'zod'
import { ApiRouteConfig, StepHandler } from '@motiadev/core'

const inputSchema = z.object({})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Start Event',
  description: 'Start the Motia Server Example flow',
  path: '/api/motia-server-example',
  method: 'POST',
  emits: ['ws-server-example.start'],
  bodySchema: inputSchema,
  flows: ['motia-server'],
}

export const handler: StepHandler<typeof config> = async (_, { emit, logger }) => {
  logger.info('[Motia Server Example] start-event')

  await emit({
    type: 'ws-server-example.start',
    data: { message: 'The flow has been started!' },
  })

  return {
    status: 200,
    body: { message: 'The flow has been started!' },
  }
}
