import { FlowConfig, FlowExecutor } from 'wistro'
import { z } from 'zod'

type Input = typeof inputSchema

const inputSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      value: z.number(),
    }),
  ),
})

export const config: FlowConfig<Input> = {
  name: 'Validate Data',
  subscribes: ['hybrid.received'],
  emits: ['hybrid.validated'],
  input: inputSchema,
  flows: ['hybrid-example'],
}

export const executor: FlowExecutor<Input> = async (input, emit) => {
  await emit({
    type: 'hybrid.validated',
    data: {
      items: input.data,
      timestamp: new Date().toISOString(),
    },
  })
}
