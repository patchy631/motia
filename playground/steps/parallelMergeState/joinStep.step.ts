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

export const executor: FlowExecutor<Input> = async (_, emit, { logger, state, traceId }) => {
  logger.info(`[join-step] Checking state - traceId: ${traceId}`)

  const pmState = await state.get<
    Partial<{
      stepA: { msg: string; timestamp: number }
      stepB: { msg: string; timestamp: number }
      stepC: { msg: string; timestamp: number }
      done: boolean
    }>
  >()

  if (!pmState.done || !pmState.stepA || !pmState.stepB || !pmState.stepC) {
    logger.info('[join-step] Not all steps done yet, ignoring for now.')
    return
  }

  logger.info('[join-step] All steps are complete. Merging results...')

  const merged = {
    stepA: pmState.stepA,
    stepB: pmState.stepB,
    stepC: pmState.stepC,
    mergedAt: new Date().toISOString(),
  }

  await emit({
    type: 'pms.join.complete',
    data: merged,
  })

  await state.clear()
}
