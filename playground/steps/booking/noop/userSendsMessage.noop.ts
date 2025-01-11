import { NoopConfig } from 'wistro'

export const config: NoopConfig = {
  type: 'noop',
  name: 'userSendsMessage',
  description: 'User sends a message',
  emits: { POST: '/api/hybrid-endpoint-example' },
  subscribes: ['dbz.message-sent'],
  flows: ['booking'],
}
