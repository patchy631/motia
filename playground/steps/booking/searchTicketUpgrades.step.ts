import { z } from 'zod'
import { EventConfig, StepHandler } from '@motiadev/core'

type Input = typeof inputSchema

const inputSchema = z.object({
  customerPhoneNumber: z.string().min(1),
  section: z.coerce.number(),
  row: z.coerce.number(),
  seat: z.coerce.number(),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Search Ticket Upgrades',
  subscribes: ['dbz.evaluate-upgrades'],
  emits: ['dbz.error', 'dbz.send-text'],
  input: inputSchema,
  flows: ['booking'],
}

export const handler: StepHandler<typeof config> = async (input, { emit, state }) => {
  const validation = inputSchema.safeParse(input)

  if (!validation.success) {
    await emit({
      type: 'dbz.error',
      data: { message: 'input validation error' },
    })
    return
  }

  try {
    const reservation = await state.get<{
      customer: { id: string; phoneNumber: string }
      venue: { id: string; phoneNumber: string; name: string }
    }>(`booking_${input.customerPhoneNumber}`, 'reservation')

    if (reservation?.customer?.phoneNumber !== input.customerPhoneNumber) {
      throw new Error(
        'there is no reservation for the phone number provided, please check the phone number and try again',
      )
    }

    const seatsResponse = await fetch(
      `https://supreme-voltaic-flyaway.glitch.me/seats/upgrade?section=${input.section}&row=${input.row}&seat=${input.seat}`,
    )

    if (!seatsResponse.ok) {
      throw new Error('failed to retrieve upgrade seats')
    }

    const { upgradedSeats } = await seatsResponse.json()

    if (!upgradedSeats.length) {
      await emit({
        type: 'dbz.send-text',
        data: {
          message: 'Sorry, there are no available seats for your venue',
          phoneNumber: input.customerPhoneNumber,
        },
      })
      return
    }

    const seatList = upgradedSeats
      .map(
        (seat: { section: string; row: string; seat: string }) =>
          `Section: ${seat.section}, Row: ${seat.row}, Seat: ${seat.seat}`,
      )
      .join('\n')

    await emit({
      type: 'dbz.send-text',
      data: {
        message: `Here are your VIP upgrades:\n${seatList}`,
        phoneNumber: input.customerPhoneNumber,
      },
    })
  } catch (error) {
    await emit({
      type: 'dbz.error',
      data: {
        message: error instanceof Error ? error.message : `unknown error captured`,
      },
    })
  }
}
