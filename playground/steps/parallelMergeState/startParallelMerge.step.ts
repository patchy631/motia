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

export const executor: FlowExecutor<Input> = async (input, emit, { state, logger, traceId }) => {
  logger.info(`[start-event] Initializing parallel merge - traceId: ${traceId}, input: ${JSON.stringify(input)}`)

  await state.set('', {
    initialized: true,
    startTime: Date.now(),
    traceId,
  })

  await emit({
    type: 'pms.start',
    data: {
      startTime: Date.now(),
      traceId,
    },
  })
}
