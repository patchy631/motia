import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().min(1),
})

export const config: FlowConfig<Input> = {
  name: 'Update Inventory',
  description: 'Updates the inventory for the order',
  subscribes: ['ecommerce.update-inventory'],
  emits: [],
  input: inputSchema,
  workflow: 'ecommerce',
}

export const executor: FlowExecutor<Input> = async (input, _, ctx) => {
  // Here you would integrate with your inventory management system
  ctx.logger.info('[Update Inventory] Updating inventory', input)
}
