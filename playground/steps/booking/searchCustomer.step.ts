import { z } from 'zod'
import { EventConfig, StepHandler } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  venuePhoneNumber: z.string(),
  customerPhoneNumber: z.string(),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Search Customer',
  subscribes: ['dbz.search-customer'],
  emits: ['dbz.send-text', 'dbz.error'],
  input: inputSchema,
  flows: ['booking'],
}

export const handler: StepHandler<typeof config> = async (input, { emit, state }) => {
  const { venuePhoneNumber, customerPhoneNumber } = input

  try {
    const venueResponse = await fetch(`https://supreme-voltaic-flyaway.glitch.me/venue/${venuePhoneNumber}`)

    if (!venueResponse.ok) {
      throw new Error('venue not found')
    }

    const venue = await venueResponse.json()

    let customerResponse = await fetch(`https://supreme-voltaic-flyaway.glitch.me/customer/${customerPhoneNumber}`)

    if (!customerResponse.ok) {
      const createCustomerResponse = await fetch(`https://supreme-voltaic-flyaway.glitch.me/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: customerPhoneNumber }),
      })

      if (!createCustomerResponse.ok) {
        throw new Error('failed to create customer')
      }

      customerResponse = createCustomerResponse
    }

    const customer = await customerResponse.json()

    state.set(`booking_${customerPhoneNumber}`, 'reservation', {
      venue,
      customer,
    })

    await emit({
      type: 'dbz.send-text',
      data: {
        message: `Welcome ${customer.name}, can you provide your seat, row, and ticket numbers please?`,
        phoneNumber: customerPhoneNumber,
      },
    })
  } catch (error: unknown) {
    await emit({
      type: 'dbz.error',
      data: {
        message: error instanceof Error ? error.message : `unknown error captured`,
      },
    })
  }
}
