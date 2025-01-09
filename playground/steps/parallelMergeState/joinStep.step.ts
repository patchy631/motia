import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: FlowConfig<Input> = {
  name: 'join-step',
  subscribes: ['pms.stepA.done', 'pms.stepB.done', 'pms.stepC.done'],
  emits: ['pms.join.complete'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const executor: FlowExecutor<Input> = async (input, emit, { logger, state, traceId }) => {
  logger.info(`[join-step] Checking state - traceId: ${traceId}`)

  // First check if we've already completed
  const joinState = await state.get('join-state')
  if (joinState?.completed) {
    logger.info(`[join-step] Already completed for traceId: ${traceId}`)
    return
  }

  const results = await state.get('results')
  logger.info(`[join-step] Current state: ${JSON.stringify(results)}`)

  if (!results?.stepA || !results?.stepB || !results?.stepC) {
    const available = results ? Object.keys(results) : []
    logger.info(`[join-step] Waiting for steps. Have ${available.length}/3: ${available.join(', ')}`)
    return
  }

  logger.info(`[join-step] All steps complete - Results: ${JSON.stringify(results)}`)

  // Mark as completed
  await state.set('join-state', { completed: true, completedAt: Date.now() })

  await emit({
    type: 'pms.join.complete',
    data: {
      ...results,
      mergedAt: new Date().toISOString(),
    },
  })

  // Wait a bit before clearing state to ensure all events are processed
  setTimeout(async () => {
    await state.clear()
    logger.info(`[join-step] Cleared state for traceId: ${traceId}`)
  }, 1000)
}
