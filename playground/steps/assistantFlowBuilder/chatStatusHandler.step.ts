import { ApiRouteConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'

const querySchema = z.object({
  messageId: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Chat Status Handler',
  description: 'Polls the flow state to see if the flow is done or needs clarification',
  path: '/api/chat/status',
  method: 'GET',
  emits: [],
  flows: ['flow-builder'],
}

export const handler: StepHandler<typeof config> = async (req, { logger, state }) => {
  const parsed = querySchema.safeParse(req.queryParams)
  if (!parsed.success) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Invalid or missing messageId query param' },
    }
  }

  const { messageId } = parsed.data
  logger.info(`[Chat Status Handler] Checking status', ${messageId}`)

  try {
    const flowState = await state.get<{
      currentPhase: string
      error: string | null
      analysis: {
        requirements: {
          needsClarification: boolean
          clarificationQuestions: string[]
        }
      }
    }>(messageId, 'flowState')
    logger.info(`[Chat Status Handler] Retrieved flow state:', ${flowState}`)

    if (!flowState) {
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          currentPhase: 'initializing',
          error: null,
          needsClarification: false,
          clarificationQuestions: [],
          finalPlan: null,
        },
      }
    }

    // Handle error state
    if (flowState.error) {
      logger.info(`[Chat Status Handler] Found error state:', error: ${flowState.error}`)
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          currentPhase: 'error',
          error: flowState.error,
          needsClarification: false,
          clarificationQuestions: [],
          finalPlan: null,
        },
      }
    }

    // Handle analysis state
    if (flowState.currentPhase === 'analysis_complete' && flowState.analysis) {
      logger.info(`[Chat Status Handler] Analysis complete: analysis: ${flowState.analysis}`)
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          currentPhase: flowState.currentPhase,
          error: null,
          needsClarification: flowState.analysis.requirements.needsClarification,
          clarificationQuestions: flowState.analysis.requirements.clarificationQuestions || [],
          finalPlan: null,
        },
      }
    }

    // Return current state
    logger.info(`[Chat Status Handler] Returning current state:', ${flowState}`)
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        currentPhase: flowState.currentPhase,
        error: flowState.error,
        needsClarification: false,
        clarificationQuestions: [],
        finalPlan: null,
      },
    }
  } catch (error) {
    logger.error(`[Chat Status Handler] Error:', ${error}`)
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        currentPhase: 'error',
        error: error instanceof Error ? error.message : 'Unknown error checking status',
        needsClarification: false,
        clarificationQuestions: [],
        finalPlan: null,
      },
    }
  }
}
