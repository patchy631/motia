import { NoopConfig } from 'wistro'

export const config: NoopConfig = {
  type: 'noop',
  name: 'User Sends Message',
  virtualEmit: '/api/booking/initialize',
  flows: ['booking'],
}
