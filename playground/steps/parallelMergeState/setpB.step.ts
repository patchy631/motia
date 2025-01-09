import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: FlowConfig<Input> = {
  name: 'StepB',
  subscribes: ['pms.start'],
  emits: ['pms.StepB.done'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const executor: FlowExecutor<Input> = async (_, emit, { traceId, logger, state }) => {
  logger.info('[stepB] received pms.start, traceId =', traceId)

  const partialResultB = { msg: 'Hello from Step B', timestamp: Date.now() }
  await state.set<{ msg: string; timestamp: number }>('stepB', partialResultB)
  await state.set('done', true)

  await state.get('StepB')

  await emit({
    type: 'pms.StepB.done',
    data: partialResultB,
  })
}
