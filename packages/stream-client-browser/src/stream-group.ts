import { GroupEventMessage, GroupJoinMessage, Listener, Message } from './stream.types'

export class StreamGroupSubscription<TData extends { id: string }> {
  private onChangeListeners: Set<Listener<TData[]>> = new Set()
  private listeners: Set<EventListener> = new Set()

  private state: TData[] = []

  constructor(
    private readonly ws: WebSocket,
    private readonly sub: GroupJoinMessage,
  ) {
    const message: Message = { type: 'join', data: sub }
    const listenerWrapper = (event: MessageEvent<GroupEventMessage<TData>>) => {
      const isStreamName = event.data.streamName === this.sub.streamName
      const isGroupId = 'groupId' in event.data && event.data.groupId === this.sub.groupId

      if (isStreamName && isGroupId) {
        if (event.data.event.type === 'sync') {
          this.state = event.data.event.data
        } else if (event.data.event.type === 'create') {
          this.state = [...this.state, event.data.event.data]
        } else if (event.data.event.type === 'update') {
          const messageData = event.data.event.data
          const messageDataId = messageData.id
          this.state = this.state.map((item) => (item.id === messageDataId ? messageData : item))
        } else if (event.data.event.type === 'delete') {
          const messageDataId = event.data.event.data.id
          this.state = this.state.filter((item) => item.id !== messageDataId)
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

  addChangeListener(listener: Listener<TData[]>) {
    this.onChangeListeners.add(listener)
  }

  removeChangeListener(listener: Listener<TData[]>) {
    this.onChangeListeners.delete(listener)
  }

  getState(): TData[] {
    return this.state
  }
}
