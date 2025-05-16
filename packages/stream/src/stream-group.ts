import WebSocket from 'ws'
import { GroupEventMessage, GroupJoinMessage, Listener, Message } from './stream.types'

export class StreamGroupSubscription<TData extends { id: string }> {
  private onChangeListeners: Set<Listener<TData[]>> = new Set()
  private listeners: Set<(message: GroupEventMessage<TData>) => void> = new Set()

  private state: TData[] = []

  constructor(
    private readonly ws: WebSocket,
    private readonly sub: GroupJoinMessage,
  ) {
    const message: Message = { type: 'join', data: sub }
    const listenerWrapper = (message: GroupEventMessage<TData>) => {
      const isStreamName = message.streamName === this.sub.streamName
      const isGroupId = 'groupId' in message && message.groupId === this.sub.groupId

      if (isStreamName && isGroupId) {
        if (message.event.type === 'sync') {
          this.state = message.event.data
        } else if (message.event.type === 'create') {
          this.state = [...this.state, message.event.data]
        } else if (message.event.type === 'update') {
          const messageData = message.event.data
          const messageDataId = messageData.id
          this.state = this.state.map((item) => (item.id === messageDataId ? messageData : item))
        } else if (message.event.type === 'delete') {
          const messageDataId = message.event.data.id
          this.state = this.state.filter((item) => item.id !== messageDataId)
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
