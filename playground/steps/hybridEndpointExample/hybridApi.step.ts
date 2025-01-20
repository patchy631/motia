import { ApiRouteConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

const bodySchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      value: z.number(),
    }),
  ),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Hybrid Endpoint Example',
  description: 'Triggered when a message is received from hybrid endpoint',
  path: '/api/hybrid-endpoint-example',
  method: 'POST',
  emits: ['hybrid.validated'],
  flows: ['hybrid-example'],
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

  await emit({ type: 'hybrid.validated', data: data })

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { message: 'Message received' },
  }
}
