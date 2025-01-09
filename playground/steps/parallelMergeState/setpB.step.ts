import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: FlowConfig<Input> = {
  name: 'stepB',
  subscribes: ['pms.start'],
  emits: ['pms.stepB.done'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const executor: FlowExecutor<Input> = async (_, emit, { state, logger, traceId }) => {
  logger.info(`[stepB] received pms.start, traceId = ${traceId}`)

  const partialResultA = { msg: 'Hello from Step B', timestamp: Date.now() }
  await state.set('stepB', partialResultA)

  await emit({
    type: 'pms.stepB.done',
    data: partialResultA,
  })
}
