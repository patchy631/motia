import { z } from 'zod'
import { EventConfig, StepHandler } from '@motiadev/core'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Node Finalizer',
  subscribes: ['handshake.apiResponse'],
  emits: [],
  input: inputSchema,
  flows: ['handshake'],
}

export const handler: StepHandler<typeof config> = async (input) => {
  console.log('[Node Finalizer] Received final API response:', input)
  // This is our last step. We won't emit any more events.
}
