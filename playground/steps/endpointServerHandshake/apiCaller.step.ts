import { z } from 'zod'
import { EventConfig, StepHandler } from '@motiadev/core'

type Input = typeof inputSchema

const inputSchema = z.object({
  userMessage: z.string(),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'API Caller',
  subscribes: ['handshake.callApi'],
  emits: ['handshake.apiResponse'],
  input: inputSchema,
  flows: ['handshake'],
}

export const handler: StepHandler<typeof config> = async (input, { emit }) => {
  console.log('[API Caller] Received callApi event:', input)

  // For demonstration, let's fetch from a public JSON placeholder API:
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1')
  const json = await response.json()

  // Combine userMessage + external API result
  const result = {
    externalTodo: json, // e.g. { userId, id, title, completed }
    userMessage: input.userMessage,
  }

  console.log('[API Caller] External API result:', result)

  await emit({
    type: 'handshake.apiResponse',
    data: result,
  })
}
