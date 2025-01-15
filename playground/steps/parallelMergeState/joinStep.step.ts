import { z } from 'zod'
import { EventConfig, StepHandler } from 'wistro'
import { ParallelMergeStep } from './parallelMerge.types'

type Input = typeof inputSchema

const inputSchema = z.object({ msg: z.string(), timestamp: z.number() })

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'join-step',
  subscribes: ['pms.stepA.done', 'pms.stepB.done', 'pms.stepC.done'],
  emits: ['pms.join.complete'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const handler: StepHandler<typeof config> = async (input, { emit, traceId, state, logger }) => {
  logger.info('[join-step] Handling Join Step', { input })

  const stepA = await state.get<ParallelMergeStep>(traceId, 'stepA')
  const stepB = await state.get<ParallelMergeStep>(traceId, 'stepB')
  const stepC = await state.get<ParallelMergeStep>(traceId, 'stepC')

  if (!stepA || !stepB || !stepC) {
    logger.info('[join-step] Not all steps done yet, ignoring for now.', { stepA, stepB, stepC })
    return
  }

  logger.info('[join-step] All steps are complete. Merging results...', { stepA, stepB, stepC })

  const mergedAt = new Date().toISOString()
  const merged = { stepA, stepB, stepC, mergedAt }

  await emit({ type: 'pms.join.complete', data: merged })
  await state.clear(traceId)
}
