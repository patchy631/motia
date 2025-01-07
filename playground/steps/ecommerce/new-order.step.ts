import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().min(1),
})

export const config: FlowConfig<Input> = {
  name: 'New Order',
  description: 'Receives a new order and checks if the item is in stock',
  subscribes: ['ecommerce.new-order'],
  emits: ['ecommerce.check-inventory'],
  input: inputSchema,
  workflow: 'ecommerce',
}

export const executor: FlowExecutor<Input> = async (input, emit, ctx) => {
  ctx.logger.info('[New Order] New order received', input)

  await emit({
    type: 'ecommerce.check-inventory',
    data: {
      sku: input.sku,
      quantity: input.quantity,
    },
  })
}
