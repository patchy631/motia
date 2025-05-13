import '../../types'
import { ApiRouteConfig, Emitter, StepHandler } from 'motia'
import { z } from 'zod'

const inputSchema = z.object({ message: z.string({ description: 'The message to send to OpenAI' }) })
const responseSchema = z.object({ message: z.string({ description: 'The message from OpenAI' }) })

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Call OpenAI',
  description: 'Call OpenAI',
  path: '/open-ai',
  method: 'POST',
  emits: ['call-openai'],
  flows: ['openai'],
  queryParams: [
    { name: 'model', description: 'The model to use' },
    { name: 'temperature', description: 'The temperature to use' },
  ],
  bodySchema: inputSchema,
  responseBody: responseSchema,
}

interface EmitData {
  topic: 'openai-prompt'
  data: { message: string }
}

type Emitter = (event: EmitData) => Promise<void>

export const handler: StepHandler<typeof config> = async (req, { traceId, logger, emit, streams }) => {
  logger.info('[Call OpenAI] Received callOpenAi event', { message: req.body.message })

  const result = await streams.openai.create(traceId, { message: '' })

  const eee: Emitter = async (event) => {
    console.log('event', event)
  }

  await eee({
    topic: 'openai-prompt',
    data: { message: req.body.message },
  })

  await emit({
    topic: 'openai-prompt',
    data: { message: req.body.message },
  })

  return {
    status: 200,
    body: result,
  }
}
