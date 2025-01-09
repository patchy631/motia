import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: FlowConfig<Input> = {
  name: 'stepC',
  subscribes: ['pms.start'],
  emits: ['pms.stepC.done'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const executor: FlowExecutor<Input> = async (_, emit, { traceId, logger, state }) => {
  logger.info('[stepC] received pms.start, traceId =', traceId)

  const partialResultC = { msg: 'Hello from Step C', timestamp: Date.now() }
  await state.set<{ msg: string; timestamp: number }>('stepC', partialResultC)
  await state.set('done', true)

  await state.get('stepC')

  await emit({
    type: 'pms.stepC.done',
    data: partialResultC,
  })
}
