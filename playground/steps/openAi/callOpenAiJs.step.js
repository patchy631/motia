export const config = {
  type: 'event',
  name: 'Call OpenAI',
  subscribes: ['call-openai'],
  emits: ['openai-response'],
  flows: ['openai'],
}

export const handler = async (input, { logger, emit }) => {
  logger.info('[Call OpenAI from JS] Received callOpenAi event', input)

  await emit({
    type: 'openai-response',
    data: { message: input.message },
  })
}
