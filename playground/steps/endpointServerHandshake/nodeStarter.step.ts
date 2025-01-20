import { z } from 'zod'
import { EventConfig, StepHandler } from '@motiadev/core'

type Input = typeof inputSchema

const inputSchema = z.object({
  message: z.string(),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Node Starter',
  subscribes: ['handshake.initiate'],
  emits: ['handshake.callApi'],
  input: inputSchema,
  flows: ['handshake'],
}

export const handler: StepHandler<typeof config> = async (input, { emit }) => {
  console.log('[Node Starter] Received initiate event:', input)
  const userMessage = input.message || 'Hello from Node Starter!'
  // Now emit an event telling the server-based component to do an API call
  await emit({
    type: 'handshake.callApi',
    data: { userMessage },
  })
}
