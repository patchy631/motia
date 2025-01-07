import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  message: z.string(),
})

export const config: FlowConfig<Input> = {
  name: 'OpenAI Response',
  subscribes: ['openai-response'],
  emits: [],
  input: inputSchema,
  workflow: 'openai',
}

export const executor: FlowExecutor<Input> = async (input, _, ctx) => {
  ctx.logger.info('[OpenAI Response] Received event', input)
}
