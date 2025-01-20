import { EventConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

const negativeSchema = z.object({
  sentiment: z.string(),
  analysis: z.string().optional(),
})

export const config: EventConfig<typeof negativeSchema> = {
  type: 'event',
  name: 'Negative Sentiment Responder',
  subscribes: ['openai.negativeSentiment'],
  emits: [],
  input: negativeSchema,
  flows: ['sentiment-demo'],
}

export const handler: StepHandler<typeof config> = async (input, { logger }) => {
  logger.info('[Negative Responder] The sentiment is negative or unknown.', { analysis: input.analysis })
  // Could escalate to a service, or respond gently, etc.
}
