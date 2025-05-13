import { OpenAI } from 'openai'
import { EventConfig, StepHandler } from 'motia'
import { z } from 'zod'

type Input = typeof inputSchema

const inputSchema = z.object({
  message: z.string({ description: 'The message to send to OpenAI' }),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Call OpenAI',
  description: 'Call OpenAI',
  subscribes: ['openai-prompt'],
  emits: [{ topic: 'openai-response', label: 'OpenAI Response' }],
  input: inputSchema,
  flows: ['open-ai'],
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_ })

export const handler: StepHandler<typeof config> = async (input, context) => {
  const { logger, traceId } = context

  logger.info('[Call OpenAI] Received callOpenAi event', input)

  const result = await openai.chat.completions.create({
    messages: [{ role: 'system', content: input.message }],
    model: 'gpt-4o-mini',
    stream: true,
  })

  const messages: string[] = []

  for await (const chunk of result) {
    messages.push(chunk.choices[0].delta.content ?? '')

    await context.streams.openai.update(traceId, {
      message: messages.join(''),
    })
  }

  logger.info('[Call OpenAI] OpenAI response', result)
}
