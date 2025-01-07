import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  cta: z.string().min(1),
})

export const config: FlowConfig<Input> = {
  name: 'Notify User',
  description: 'Notifies the user of an event',
  subscribes: ['ecommerce.notify-user'],
  emits: [],
  input: inputSchema,
  workflow: 'ecommerce',
}

export const executor: FlowExecutor<Input> = async (input, _, ctx) => {
  // Here you would integrate with your notification system
  ctx.logger.info('[Notify User] Sending notification', input)
}
