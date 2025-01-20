import { ApiRouteConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

const bodySchema = z.object({
  message: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Endpoint Server Handshake',
  description: 'Triggered when a message is received from endpoint server',
  path: '/api/endpoint-server-handshake',
  method: 'POST',
  emits: ['handshake.initiate'],
  flows: ['handshake'],
  bodySchema,
}

export const handler: StepHandler<typeof config> = async (req, { emit }) => {
  const { success, data } = bodySchema.safeParse(req.body)

  if (!success || !data) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'input validation error' },
    }
  }

  await emit({
    type: 'handshake.initiate',
    data: {
      message: data.message,
    },
  })

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { message: 'Handshake initiated' },
  }
}
