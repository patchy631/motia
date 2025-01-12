import { z } from 'zod'
import { EventConfig, StepHandler } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({
  message: z.string(),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'OpenAI Response',
  subscribes: ['openai-response'],
  emits: [],
  input: inputSchema,
  flows: ['openai'],
}

export const handler: StepHandler<typeof config> = async (input, { logger }) => {
  logger.info('[OpenAI Response] Received event', input)
}
