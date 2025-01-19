import { ApiRouteConfig, StepHandler } from '@motia/core'
import { z } from 'zod'

// Define the expected request body schema
const bodySchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  messageId: z.string().uuid('Must provide a valid UUID'),
  timestamp: z.string().datetime('Must provide a valid ISO datetime'),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Chat Message Handler',
  description: 'Receives chat messages and initiates the flow building process',
  path: '/api/chat/message',
  method: 'POST',
  emits: ['flow-builder.analyze-intent'],
  flows: ['flow-builder'],
  bodySchema,
}

export const handler: StepHandler<typeof config> = async (req, { emit, logger, state }) => {
  const { message, messageId, timestamp } = req.body

  logger.info('[Chat Message Handler] Received new message', { messageId, timestamp })

  // Initialize flow state
  await state.set(messageId, 'flowState', {
    currentPhase: 'started',
    timestamp,
    error: null,
  })

  // Emit event to start intent analysis
  await emit({
    type: 'flow-builder.analyze-intent',
    data: {
      message,
      messageId,
      timestamp,
    },
  })

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      status: 'processing',
      messageId,
    },
  }
}
