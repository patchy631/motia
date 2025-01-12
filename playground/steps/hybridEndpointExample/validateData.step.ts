import { EventConfig, StepHandler } from 'wistro'
import { z } from 'zod'

type Input = typeof inputSchema

const inputSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      value: z.number(),
    }),
  ),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Validate Data',
  subscribes: ['hybrid.received'],
  emits: ['hybrid.validated'],
  input: inputSchema,
  flows: ['hybrid-example'],
}

export const handler: StepHandler<typeof config> = async (input, { emit }) => {
  await emit({
    type: 'hybrid.validated',
    data: {
      items: input.items,
      timestamp: new Date().toISOString(),
    },
  })
}
