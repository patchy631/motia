import { ApiRouteConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

const responseSchema = z.object({ message: z.string({ description: 'The message from OpenAI' }) })

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Get Message by Trace ID',
  description: 'Retrieves a generated message from OpenAI based on the Trace ID returned by the POST /openai endpoint',
  path: '/openai/:traceId',
  method: 'GET',
  emits: ['call-openai'],
  flows: ['openai'],
  responseBody: responseSchema,
  queryParams: [
    {
      name: 'includeProps',
      description: 'Whether to include the properties of the message',
    },
  ],
}

export const handler: StepHandler<typeof config> = async (req, { logger }) => {
  logger.info('[Call OpenAI] Received callOpenAi event', req)

  return {
    status: 200,
    body: { message: 'OpenAI response sent' },
  }
}
