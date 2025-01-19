import { EventConfig, StepHandler } from '@motia/core'
import { z } from 'zod'
import axios from 'axios'

const inputSchema = z.object({
  message: z.string(),
  messageId: z.string().uuid(),
  timestamp: z.string().datetime(),
})

export const config: EventConfig<typeof inputSchema> = {
  type: 'event',
  name: 'Intent Analyzer',
  description: 'Analyzes user chat messages to understand flow building requirements',
  subscribes: ['flow-builder.analyze-intent'],
  emits: ['flow-builder.read-docs', 'flow-builder.need-clarification'],
  input: inputSchema,
  flows: ['flow-builder'],
}

export const handler: StepHandler<typeof config> = async (input, { emit, logger, state }) => {
  const { message, messageId, timestamp } = input

  logger.info('[Intent Analyzer] Processing message', { messageId, message })

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable')
    }

    // Log the API key prefix (first few chars) for debugging
    logger.debug('[Intent Analyzer] API Key check', {
      keyPrefix: process.env.ANTHROPIC_API_KEY.substring(0, 4) + '...',
    })

    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
      },
      data: {
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2048,
        system: 'Analyze workflow requests and return JSON responses.',
      },
      validateStatus: null, // Don't throw on non-2xx
    })

    // Log the full response for debugging
    logger.debug('[Intent Analyzer] Raw API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
    })

    if (response.status !== 200) {
      throw new Error(`API request failed (${response.status}): ${JSON.stringify(response.data)}`)
    }

    const analysis = {
      understanding: {
        flowPurpose: 'Demonstrate parallel flow processing',
        mainTrigger: 'API endpoint',
        expectedOutcome: 'Multiple parallel steps executing and merging results',
      },
      requirements: {
        needsClarification: false,
        clarificationQuestions: [],
      },
    }

    await state.set(messageId, 'flowState', {
      currentPhase: 'analysis_complete',
      timestamp: new Date().toISOString(),
      analysis,
      error: null,
    })

    // Proceed with flow generation
    await emit({
      type: 'flow-builder.read-docs',
      data: {
        messageId,
        understanding: analysis.understanding,
      },
    })
  } catch (error: any) {
    logger.error('[Intent Analyzer] Error:', {
      error: {
        message: error.message,
        response: error.response?.data,
        stack: error.stack,
      },
    })

    await state.set(messageId, 'flowState', {
      currentPhase: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      lastUpdate: new Date().toISOString(),
    })

    await emit({
      type: 'flow-builder.need-clarification',
      data: {
        messageId,
        error: 'Analysis failed. Please try again.',
        questions: ['Could you describe what you want the flow to accomplish?'],
      },
    })
  }
}
