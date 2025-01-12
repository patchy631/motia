import { ApiRouteConfig, StepHandler } from 'wistro'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Parallel Merge',
  description: 'Triggered when a message is received from parallel merge',
  path: '/api/parallel-merge',
  method: 'POST',
  emits: ['pms.start'],
  flows: ['parallel-merge'],
}

export const handler: StepHandler<typeof config> = async (_, { emit }) => {
  await emit({ type: 'pms.start', data: {} })

  return { status: 200, body: { message: 'Started parallel merge' } }
}
