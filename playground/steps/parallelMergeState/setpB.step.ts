import { z } from 'zod'
import { EventConfig, StepHandler } from 'wistro'
import { ParallelMergeStep } from './parallelMerge.types'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'stepB',
  subscribes: ['pms.start'],
  emits: ['pms.stepB.done'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const handler: StepHandler<typeof config> = async (_, { emit, traceId, state, logger }) => {
  logger.info('[stepB] received pms.start')

  const partialResultB: ParallelMergeStep = { msg: 'Hello from Step B', timestamp: Date.now() }
  await state.set<ParallelMergeStep>(traceId, 'stepB', partialResultB)

  await new Promise((resolve) => setTimeout(resolve, 100))
  await emit({
    type: 'pms.stepB.done',
    data: partialResultB,
  })
}
