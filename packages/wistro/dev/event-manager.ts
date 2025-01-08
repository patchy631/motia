import { Event, EventManager, Handler } from './../wistro.types'

export const createEventManager = (globalSubscriber?: (event: Event<unknown>) => void): EventManager => {
  const handlers: Record<string, Handler[]> = {}

  const emit = async <TData>(event: Event<TData>) => {
    globalSubscriber?.(event)

    const eventHandlers = handlers[event.type] ?? []

    console.log(`[Flow Emit] ${event.type} emitted`, { handlers: eventHandlers.length })
    eventHandlers.map((handler) => handler(event))
  }

  const subscribe = <TData>(event: string, handlerName: string, handler: Handler<TData>) => {
    if (!handlers[event]) {
      handlers[event] = []
    }

    console.log(`[Flow Sub] ${handlerName} subscribing to ${event}`)

    handlers[event].push(handler as Handler)
  }

  return { emit, subscribe }
}
