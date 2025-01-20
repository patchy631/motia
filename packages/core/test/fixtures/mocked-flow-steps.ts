import { z } from 'zod'
import { Step } from '../../src/types'

export const mockFlowSteps: Step[] = [
  {
    config: {
      type: 'api',
      name: 'Start Event',
      description: 'Start the Motia Server Example flow',
      path: '/api/motia-server-example',
      method: 'POST',
      emits: ['ws-server-example.start'],
      flows: ['motia-server'],
    },
    version: '1',
    filePath: '/playground/steps/motiaServerExample/startServerExample.step.ts',
  },
  {
    config: {
      type: 'event',
      name: 'Processor',
      subscribes: ['ws-server-example.start'],
      emits: ['ws-server-example.processed'],
      input: z.object({}),
      flows: ['motia-server'],
    },
    version: '1',
    filePath: '/playground/steps/motiaServerExample/processor.step.ts',
  },
  {
    config: {
      type: 'event',
      name: 'Finalizer',
      subscribes: ['ws-server-example.processed'],
      emits: [],
      input: z.object({}),
      flows: ['motia-server'],
    },
    version: '1',
    filePath: '/playground/steps/motiaServerExample/finalizer.step.ts',
  },
]

export const mockedFlows = {
  'motia-server': {
    name: 'Motia Server Example',
    steps: mockFlowSteps,
  },
}
