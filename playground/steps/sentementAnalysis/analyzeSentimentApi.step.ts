import { ApiRouteConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Analyze Sentiment (API)',
  path: '/api/analyze-sentiment',
  method: 'POST',
  emits: ['openai.analyzeSentimentRequest'],
  bodySchema: z.object({
    text: z.string().min(1, 'text is required'),
  }),
  flows: ['sentiment-demo'],
}

export const handler: StepHandler<typeof config> = async (req, { emit, logger }) => {
  const { text } = req.body

  logger.info('[AnalyzeSentimentAPI] Received text', { text })

  // Emit an event to call OpenAI
  await emit({
    type: 'openai.analyzeSentimentRequest',
    data: { text },
  })

  // Return right away
  return {
    status: 200,
    body: { status: 'Accepted', message: 'Your text is being analyzed' },
  }
}
