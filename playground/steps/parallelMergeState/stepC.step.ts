import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'
import { updateStateResults } from './stateManager'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: FlowConfig<Input> = {
  name: 'stepC',
  subscribes: ['pms.start'],
  emits: ['pms.stepC.done'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const executor: FlowExecutor<Input> = async (input, emit, { traceId, logger, state }) => {
  logger.info(`[stepC] executing - traceId: ${traceId}, input: ${JSON.stringify(input)}`)

  const partialResultC = {
    msg: 'Hello from Step C',
    timestamp: Date.now(),
  }

  // Update state
  const currentState = await updateStateResults(state, 'stepC', partialResultC)
  logger.info(`[stepC] Updated state: ${JSON.stringify(currentState)}`)

  await emit({
    type: 'pms.stepC.done',
    data: partialResultC,
  })
}
