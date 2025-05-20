import { v4 as uuidv4 } from 'uuid'
import { StreamGroupSubscription } from './stream-group'
import { StreamItemSubscription } from './stream-item'

export class Stream {
  private ws: WebSocket

  constructor(address: string) {
    this.ws = new WebSocket(address)
  }

  subscribeItem<TData extends { id: string }>(streamName: string, id: string): StreamItemSubscription<TData> {
    const subscriptionId = uuidv4()
    return new StreamItemSubscription<TData>(this.ws, { streamName, id, subscriptionId })
  }

  subscribeGroup<TData extends { id: string }>(streamName: string, groupId: string): StreamGroupSubscription<TData> {
    const subscriptionId = uuidv4()
    return new StreamGroupSubscription<TData>(this.ws, { streamName, groupId, subscriptionId })
  }

  close() {
    this.ws.close()
  }
}
