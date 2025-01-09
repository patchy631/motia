import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'
import { updateStateResults } from './stateManager'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: FlowConfig<Input> = {
  name: 'stepB',
  subscribes: ['pms.start'],
  emits: ['pms.stepB.done'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const executor: FlowExecutor<Input> = async (input, emit, { traceId, logger, state }) => {
  logger.info(`[stepB] executing - traceId: ${traceId}, input: ${JSON.stringify(input)}`)

  const partialResultC = {
    msg: 'Hello from Step B',
    timestamp: Date.now(),
  }

  // Update state
  const currentState = await updateStateResults(state, 'stepB', partialResultC)
  logger.info(`[stepB] Updated state: ${JSON.stringify(currentState)}`)

  await emit({
    type: 'pms.stepB.done',
    data: partialResultC,
  })
}
