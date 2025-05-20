import { ItemEventMessage, ItemJoinMessage, Listener, Message } from './stream.types'

export class StreamItemSubscription<TData extends { id: string }> {
  private onChangeListeners: Set<Listener<TData>> = new Set()
  private listeners: Set<EventListener> = new Set()

  private state: TData | null = null

  constructor(
    private readonly ws: WebSocket,
    private readonly sub: ItemJoinMessage,
  ) {
    const message: Message = { type: 'join', data: sub }
    const listenerWrapper = (message: MessageEvent<ItemEventMessage<TData>>) => {
      const isStreamName = message.data.streamName === this.sub.streamName
      const isId = 'id' in message.data && message.data.id === this.sub.id

      if (isStreamName && isId) {
        if (
          message.data.event.type === 'sync' ||
          message.data.event.type === 'create' ||
          message.data.event.type === 'update'
        ) {
          this.state = message.data.event.data
        } else if (message.data.event.type === 'delete') {
          this.state = null
        }

        this.onChangeListeners.forEach((listener) => listener(this.state))
      }
    }
    this.ws.addEventListener('message', listenerWrapper as EventListener)
    this.listeners.add(listenerWrapper as EventListener)

    ws.send(JSON.stringify(message))
  }

  close() {
    const message: Message = { type: 'leave', data: this.sub }
    this.ws.send(JSON.stringify(message))
    this.listeners.forEach((listener) => this.ws.removeEventListener('message', listener))
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
