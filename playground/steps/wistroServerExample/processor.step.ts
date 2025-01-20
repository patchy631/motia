import { z } from 'zod'
import { EventConfig, StepHandler } from '@motiadev/core'

type Input = typeof inputSchema

const inputSchema = z.object({
  message: z.string(),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Processor',
  subscribes: ['ws-server-example.start'],
  emits: ['ws-server-example.processed'],
  input: inputSchema,
  flows: ['motia-server'],
}

export const handler: StepHandler<typeof config> = async (input, { emit, logger }) => {
  logger.info('[Processor] received:', input)
  // Just an example: reverse the message string
  const reversed = input.message ? input.message.split('').reverse().join('') : '(no input.message)'

  await emit({
    type: 'ws-server-example.processed',
    data: { reversed },
  })
}
