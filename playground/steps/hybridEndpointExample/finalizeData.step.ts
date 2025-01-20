import { EventConfig, StepHandler } from '@motiadev/core'
import { SharedFlowInputSchema } from './items.schema'

type Input = typeof inputSchema

const inputSchema = SharedFlowInputSchema

export const config: EventConfig<Input> = {
  type: 'event',
  name: 'Fanialize Data',
  subscribes: ['hybrid.analyzed'],
  emits: ['hybrid.completed'],
  input: inputSchema,
  flows: ['hybrid-example'],
}

export const handler: StepHandler<typeof config> = async (input, { emit }) => {
  const { items, analysis, timestamp } = input

  await emit({
    type: 'hybrid.completed',
    data: {
      summary: {
        itemCount: items.length,
        statistics: analysis,
        startTime: timestamp,
        endTime: new Date().toISOString(),
      },
    },
  })
}
