import { EventConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'
import equal from 'deep-equal'

type Input = typeof inputSchema

const inputSchema = z.object({
  key: z.string(),
  expected: z.optional(z.unknown()),
})

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Check state change',
  description: 'check state change',
  subscribes: ['check-state-change'],
  emits: [],
  input: inputSchema,
  flows: ['test-state'],
}

export const handler: StepHandler<typeof config> = async (input, { traceId, logger, state }) => {
  logger.info('[Test motia state with TS] received check-state-change event', input)

  const value = await state.get<any>(traceId, input.key)

  if (!equal(value.data, input.expected, { strict: true })) {
    logger.error(`[Test motia state with TS] state value is not as expected`, { value, expected: input.expected })
  } else {
    logger.info(`[Test motia state with TS] state value is as expected 🏁 🟢`)
  }
}
