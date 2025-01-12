import { EventConfig, StepHandler } from 'wistro'
import { z } from 'zod'

type Input = typeof inputSchema

const inputSchema = z.object({
  message: z.string({
    description: 'The message to send to OpenAI',
  }),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Call OpenAI',
  description: 'Call OpenAI',
  subscribes: ['call-openai'],
  emits: [{ type: 'openai-response', label: 'OpenAI Response' }],
  input: inputSchema,
  flows: ['openai'],
}

export const handler: StepHandler<typeof config> = async (input, { logger, emit }) => {
  logger.info('[Call OpenAI] Received callOpenAi event', input)

  await emit({
    type: 'openai-response',
    data: { message: input.message },
  })
}
