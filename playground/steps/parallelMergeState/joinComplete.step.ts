import { EventConfig, StepHandler } from 'wistro'
import { z } from 'zod'

type Input = typeof inputSchema

const stepSchema = z.object({ msg: z.string(), timestamp: z.number() })
const inputSchema = z.object({
  stepA: stepSchema,
  stepB: stepSchema,
  stepC: stepSchema,
  mergedAt: z.string(),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Join Complete',
  subscribes: ['pms.join.complete'],
  emits: [],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const handler: StepHandler<typeof config> = async (input, { logger }) => {
  logger.info('[Join Complete] Handling Join Complete', { input })
}
