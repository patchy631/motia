import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

const inputSchema = z.object({
  id: z.string({ description: 'The id of the stream item' }),
  message: z.string({ description: 'The message to send to OpenAI' }),
})
const responseSchema = z.object({ message: z.string({ description: 'The message from OpenAI' }) })

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'OpenAiApi',
  description: 'Call OpenAI',
  path: '/open-ai',
  method: 'POST',
  emits: ['openai-prompt'],
  flows: ['open-ai'],
  bodySchema: inputSchema,
  responseSchema: { 200: responseSchema },
}

export const handler: Handlers['OpenAiApi'] = async (req, { traceId, logger, emit, streams }) => {
  logger.info('[Call OpenAI] Received callOpenAi event', { message: req.body.message })

  const result = await streams.openai.create(traceId, { message: '' })

  await emit({
    topic: 'openai-prompt',
    data: { message: req.body.message },
  })

  return { status: 200, body: result }
}
