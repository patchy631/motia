import WebSocket from 'ws'
import { ItemEventMessage, ItemJoinMessage, Listener, Message } from './stream.types'

export class StreamItemSubscription<TData extends { id: string }> {
  private onChangeListeners: Set<Listener<TData>> = new Set()
  private listeners: Set<(message: ItemEventMessage<TData>) => void> = new Set()

  private state: TData | null = null

  constructor(
    private readonly ws: WebSocket,
    private readonly sub: ItemJoinMessage,
  ) {
    const message: Message = { type: 'join', data: sub }
    const listenerWrapper = (message: ItemEventMessage<TData>) => {
      const isStreamName = message.streamName === this.sub.streamName
      const isId = 'id' in message && message.id === this.sub.id

      if (isStreamName && isId) {
        if (message.event.type === 'sync' || message.event.type === 'create' || message.event.type === 'update') {
          this.state = message.event.data
        } else if (message.event.type === 'delete') {
          this.state = null
        }

        this.onChangeListeners.forEach((listener) => listener(this.state))
      }
    }
    this.ws.on('message', listenerWrapper)
    this.listeners.add(listenerWrapper)

    ws.send(JSON.stringify(message))
  }

  close() {
    const message: Message = { type: 'leave', data: this.sub }
    this.ws.send(JSON.stringify(message))
    this.listeners.forEach((listener) => this.ws.off('message', listener))
  }

  addChangeListener(listener: Listener<TData>) {
    this.onChangeListeners.add(listener)
  }

  removeChangeListener(listener: Listener<TData>) {
    this.onChangeListeners.delete(listener)
  }

  getState(): TData | null {
    return this.state
  }
}
