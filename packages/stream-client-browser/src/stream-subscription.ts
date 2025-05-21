import { CustomEvent, ItemEventMessage, StreamEvent } from './stream.types'

type CustomEventListener<TData> = (event: TData) => void

export abstract class StreamSubscription {
  private customEventListeners: Map<string, CustomEventListener<any>[]> = new Map()

  protected onEventReceived(event: CustomEvent) {
    const customEventListeners = this.customEventListeners.get(event.type)

    if (customEventListeners) {
      const eventData = event.data
      customEventListeners.forEach((listener) => listener(eventData))
    }
  }

  onEvent(type: string, listener: CustomEventListener<any>) {
    const listeners = this.customEventListeners.get(type) || []
    this.customEventListeners.set(type, [...listeners, listener])
  }

  offEvent(type: string, listener: CustomEventListener<any>) {
    const listeners = this.customEventListeners.get(type) || []
    this.customEventListeners.set(
      type,
      listeners.filter((l) => l !== listener),
    )
  }
}
