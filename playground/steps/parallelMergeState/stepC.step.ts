import { z } from 'zod'
import { EventConfig, StepHandler } from '@motiadev/core'
import { ParallelMergeStep } from './parallelMerge.types'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'stepC',
  description: 'Hello from Step C',
  subscribes: ['pms.start'],
  emits: ['pms.stepC.done'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const handler: StepHandler<typeof config> = async (_, { emit, traceId, state, logger }) => {
  logger.info('[stepC] received pms.start')

  await new Promise((resolve) => setTimeout(resolve, 150))

  const partialResultC: ParallelMergeStep = { msg: 'Hello from Step C', timestamp: Date.now() }
  await state.set<ParallelMergeStep>(traceId, 'stepC', partialResultC)

  await emit({
    type: 'pms.stepC.done',
    data: partialResultC,
  })
}
