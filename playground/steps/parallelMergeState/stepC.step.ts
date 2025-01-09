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

export const executor: FlowExecutor<Input> = async (_, emit, { logger, state, traceId }) => {
  logger.info(`[stepC] received pms.start, traceId = ${traceId}`)

  const partialResultA = { msg: 'Hello from Step C', timestamp: Date.now() }
  await state.set('stepC', partialResultA)
  await state.set('done', true)

  const currentState = await state.get()

  await emit({
    type: 'pms.stepC.done',
    data: partialResultA,
  })
}
