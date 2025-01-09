import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: FlowConfig<Input> = {
  name: 'Start Event',
  subscribes: ['pms.initialize'],
  emits: ['pms.start'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const executor: FlowExecutor<Input> = async (_, emit, { state, logger, traceId }) => {
  logger.info('[start-event] received pms.initialize, traceId =', traceId)
  await state.set<{}>('initialized', true)

  const pmsStateId = Math.random().toString(36).substring(2)

  await emit({
    type: 'pms.start',
    data: { pmsStateId },
  })
}
