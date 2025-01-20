import { ApiRouteConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

const bodySchema = z.object({
  customerPhoneNumber: z.string().min(1),
  section: z.coerce.number(),
  row: z.coerce.number(),
  seat: z.coerce.number(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'DBZ Search Upgrades',
  description: 'Triggered when a message is received from dbz',
  path: '/api/dbz/search-upgrades',
  method: 'POST',
  emits: ['dbz.evaluate-upgrades'],
  flows: ['booking'],
  virtualSubscribes: ['/api/dbz/search-upgrades'],
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

  await emit({ type: 'dbz.evaluate-upgrades', data })

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { message: 'Upgrades search initiated' },
  }
}
