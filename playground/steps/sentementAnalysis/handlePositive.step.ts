import { EventConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

const positiveSchema = z.object({
  sentiment: z.string(),
  analysis: z.string().optional(),
})

export const config: EventConfig<typeof positiveSchema> = {
  type: 'event',
  name: 'Positive Sentiment Responder',
  subscribes: ['openai.positiveSentiment'],
  emits: [],
  input: positiveSchema,
  flows: ['sentiment-demo'],
}

export const handler: StepHandler<typeof config> = async (input, { logger }) => {
  logger.info('[Positive Responder] The sentiment is positive!', { analysis: input.analysis })
  // Maybe notify a Slack channel: "All good vibes here!"
}
