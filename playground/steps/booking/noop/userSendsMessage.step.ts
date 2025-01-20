import { NoopConfig } from '@motiadev/core'

export const config: NoopConfig = {
  type: 'noop',
  name: 'User Sends Message',
  description: 'This node is used to simulate a user sending a message to the system.',
  virtualEmits: ['/api/dbz/search-upgrades'],
  virtualSubscribes: ['dbz.message-sent'],
  flows: ['booking'],
}
