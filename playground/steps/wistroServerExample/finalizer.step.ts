import { EventConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Finalizer',
  subscribes: ['ws-server-example.processed'],
  emits: [],
  input: inputSchema,
  flows: ['motia-server'],
}

export const handler: StepHandler<typeof config> = async (input, { logger }) => {
  logger.info('[Finalizer] finalizing data:', input)
  // For demonstration, there's no further emit.
  // You could do logging, database calls, etc.
}
