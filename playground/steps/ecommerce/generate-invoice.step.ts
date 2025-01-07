import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().min(0),
  items: z.array(
    z.object({
      sku: z.string(),
      quantity: z.number(),
      price: z.number(),
    }),
  ),
})

export const config: FlowConfig<Input> = {
  name: 'Generate Invoice',
  description: 'Generates an invoice for the order',
  subscribes: ['ecommerce.generate-invoice'],
  emits: [{ type: 'ecommerce.notify-user' }, { type: 'ecommerce.update-inventory' }],
  input: inputSchema,
  workflow: 'ecommerce',
}

export const executor: FlowExecutor<Input> = async (input, emit, ctx) => {
  // Here you would integrate with your invoicing system
  ctx.logger.info('[Generate Invoice] Generating invoice for order', input)

  const invoiceNumber = `INV-${Date.now()}`

  ctx.logger.info('[Generate Invoice] Created invoice', {
    invoiceNumber,
    orderId: input.orderId,
    amount: input.amount,
    items: input.items,
  })

  await emit({
    type: 'ecommerce.notify-user',
    data: {
      userId: 'user-123', // Would need to be passed in from input
      title: 'Invoice Generated',
      description: `Invoice ${invoiceNumber} has been generated for your order ${input.orderId}`,
      cta: 'View invoice',
    },
  })
}
