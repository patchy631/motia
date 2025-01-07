import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().min(1),
})

export const config: FlowConfig<Input> = {
  name: 'Check Inventory',
  description: 'Checks if the item is in stock',
  subscribes: ['ecommerce.check-inventory'],
  emits: [
    { type: 'ecommerce.reserve-stock', label: 'Stock available', conditional: true },
    { type: 'ecommerce.notify-user', label: 'Out of stock', conditional: true },
  ],
  input: inputSchema,
  workflow: 'ecommerce',
}

export const executor: FlowExecutor<Input> = async (input, emit, ctx) => {
  // Simulate inventory check
  const inStock = Math.random() > 0.5

  if (inStock) {
    ctx.logger.info('[Check Inventory] Stock available', input)

    await emit({
      type: 'ecommerce.reserve-stock',
      data: {
        sku: input.sku,
        quantity: input.quantity,
      },
    })
  } else {
    ctx.logger.info('[Check Inventory] Out of stock', input)

    await emit({
      type: 'ecommerce.notify-user',
      data: {
        userId: 'user-123', // Would need to be passed in from input
        title: 'Out of Stock',
        description: `Sorry, the item (SKU: ${input.sku}) is currently out of stock`,
        cta: 'View similar items',
      },
    })
  }
}
