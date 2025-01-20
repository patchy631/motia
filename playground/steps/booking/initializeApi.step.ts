import { ApiRouteConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

const bodySchema = z.object({
  venuePhoneNumber: z.string({ description: 'The phone number of the venue' }).min(1),
  customerPhoneNumber: z.string({ description: 'The phone number of the customer' }).min(1),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'initialize',
  description: 'Initialize the booking flow',
  path: '/api/booking/initialize',
  method: 'POST',
  virtualSubscribes: ['/api/booking/initialize'],
  emits: ['dbz.search-customer'],
  flows: ['booking'],
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
    type: 'dbz.search-customer',
    data: {
      venuePhoneNumber: data.venuePhoneNumber,
      customerPhoneNumber: data.customerPhoneNumber,
    },
  })

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { message: 'Booking initialized' },
  }
}
