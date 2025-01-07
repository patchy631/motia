import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  message: z.string({
    description: 'The message to send to OpenAI',
  }),
})

export const config: FlowConfig<Input> = {
  name: 'Call OpenAI',
  subscribes: ['call-openai'],
  emits: [{ type: 'openai-response', label: 'OpenAI Response' }],
  input: inputSchema,
  workflow: 'openai',
}

export const executor: FlowExecutor<Input> = async (input, emit, ctx) => {
  ctx.logger.info('[Call OpenAI] Received callOpenAi event', input)

  await emit({
    type: 'openai-response',
    data: { message: input.message },
  })
}
