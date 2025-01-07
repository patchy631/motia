import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().min(1),
})

export const config: FlowConfig<Input> = {
  name: 'Reserve Stock',
  description: 'Reserves stock for the order',
  subscribes: ['ecommerce.reserve-stock'],
  emits: [
    { type: 'ecommerce.process-payment', label: 'Process payment', conditional: true },
    { type: 'ecommerce.notify-user', label: 'Reservation failed', conditional: true },
  ],
  input: inputSchema,
  workflow: 'ecommerce',
}

export const executor: FlowExecutor<Input> = async (input, emit, ctx) => {
  // Simulate stock reservation
  const reserved = Math.random() > 0.2

  if (reserved) {
    ctx.logger.info('[Reserve Stock] Stock reserved', input)

    await emit({
      type: 'ecommerce.process-payment',
      data: {
        sku: input.sku,
        quantity: input.quantity,
      },
    })
  } else {
    ctx.logger.info('[Reserve Stock] Reservation failed', input)

    await emit({
      type: 'ecommerce.notify-user',
      data: {
        userId: 'user-123', // Would need to be passed in from input
        title: 'Reservation Failed',
        description: `Sorry, the item (SKU: ${input.sku}) is currently out of stock`,
        cta: 'View similar items',
      },
    })
  }
}
