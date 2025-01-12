import { ApiRouteConfig, StepHandler } from 'wistro'
import { z } from 'zod'

const inputSchema = z.object({
  message: z.string({
    description: 'The message to send to OpenAI',
  }),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Call OpenAI',
  description: 'Call OpenAI',
  path: '/openai',
  method: 'POST',
  emits: ['call-openai'],
  bodySchema: inputSchema,
  flows: ['openai'],
}

export const handler: StepHandler<typeof config> = async (req, { logger, emit }) => {
  logger.info('[Call OpenAI] Received callOpenAi event', req)

  await emit({
    type: 'call-openai',
    data: { message: req.body.message },
  })

  return {
    status: 200,
    body: { message: 'OpenAI response sent' },
  }
}
