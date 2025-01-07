import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  orderId: z.string().min(1),
})

export const config: FlowConfig<Input> = {
  name: 'Confirm Order',
  description: 'Confirms the order and notifies the user',
  subscribes: ['ecommerce.confirm-order'],
  emits: [{ type: 'ecommerce.notify-user' }, { type: 'ecommerce.generate-invoice' }],
  input: inputSchema,
  workflow: 'ecommerce',
}

export const executor: FlowExecutor<Input> = async (input, emit, ctx) => {
  // Here you would integrate with your order management system
  ctx.logger.info('[Confirm Order] Order confirmed', input)

  await emit({
    type: 'ecommerce.notify-user',
    data: {
      userId: 'user-123', // Would need to be passed in from input
      title: 'Order Confirmed',
      description: `Your order (${input.orderId}) has been confirmed!`,
      cta: 'View order details',
    },
  })

  await emit({
    type: 'ecommerce.generate-invoice',
    data: { orderId: input.orderId },
  })
}
