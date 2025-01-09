import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: FlowConfig<Input> = {
  name: 'stepA',
  subscribes: ['pms.start'],
  emits: ['pms.stepA.done'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const executor: FlowExecutor<Input> = async (input, emit, { traceId, logger, state }) => {
  logger.info('[stepA] input =', JSON.stringify(input))
  logger.info('[stepA] received pms.start, traceId =', traceId)

  const partialResultA = { msg: 'Hello from Step A', timestamp: Date.now() }
  await state.set<{ msg: string; timestamp: number }>('stepA', partialResultA)
  await state.set('done', true)

  await state.get('stepA')

  await emit({
    type: 'pms.stepA.done',
    data: partialResultA,
  })
}
