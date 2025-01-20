import { EventConfig, StepHandler } from '@motiadev/core'
import { SharedFlowInputSchema } from './items.schema'

type Input = typeof inputSchema

const inputSchema = SharedFlowInputSchema

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Enrich Data',
  subscribes: ['hybrid.transformed'],
  emits: ['hybrid.enriched'],
  input: inputSchema,
  flows: ['hybrid-example'],
}

export const handler: StepHandler<typeof config> = async (input, { emit }) => {
  const enriched = input.items.map((item) => ({
    ...item,
    enriched_by: 'node',
    processed_at: new Date().toISOString(),
  }))

  await emit({
    type: 'hybrid.enriched',
    data: {
      items: enriched,
      timestamp: input.timestamp,
    },
  })
}
