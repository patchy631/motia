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

export const executor: FlowExecutor<Input> = async (_, emit, { logger, state, traceId }) => {
  logger.info(`[stepA] received pms.start, traceId = ${traceId}`)

  const partialResultA = { msg: 'Hello from Step A', timestamp: Date.now() }
  await state.set<{ msg: string; timestamp: number }>('stepA', partialResultA)

  console.log(await state.get('stepA'))

  await emit({
    type: 'pms.stepA.done',
    data: partialResultA,
  })
}
