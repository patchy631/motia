import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  orderId: z.string().min(1),
})

export const config: FlowConfig<Input> = {
  name: 'Cancel Order',
  description: 'Releases reserved stock and notifies the user',
  subscribes: ['ecommerce.cancel-order'],
  emits: [{ type: 'ecommerce.notify-user' }, { type: 'ecommerce.release-stock' }],
  input: inputSchema,
  workflow: 'ecommerce',
}

export const executor: FlowExecutor<Input> = async (input, emit, ctx) => {
  // Here you would integrate with your order management system
  ctx.logger.info('[Cancel Order] Order cancelled:', input.orderId)

  await emit({
    type: 'ecommerce.release-stock',
    data: { orderId: input.orderId },
  })

  await emit({
    type: 'ecommerce.notify-user',
    data: {
      userId: 'user-123', // Would need to be passed in from input
      title: 'Order Cancelled',
      description: `Your order (${input.orderId}) has been cancelled.`,
      cta: 'Place new order',
    },
  })
}
