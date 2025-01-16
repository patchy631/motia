import { Event, EventManager, Handler } from 'wistro'

interface TestEventManager extends EventManager {
  waitEvents(): Promise<void>
}

export const createEventManager = (): TestEventManager => {
  const handlers: Record<string, Handler[]> = {}
  const events: Array<Promise<unknown>> = []

  const waitEvents = async () => {
    let eventsToAwait = [...events]

    // We need to wait for all events to be resolved because the event manager is async
    // and we need to ensure that all events have been processed before we can continue
    while (eventsToAwait.length > 0) {
      events.splice(0, eventsToAwait.length)
      await Promise.allSettled(eventsToAwait)
      eventsToAwait = [...events]
    }
  }

  const emit = async <TData>(event: Event<TData>) => {
    const eventHandlers = handlers[event.type] ?? []
    events.push(...eventHandlers.map((handler) => handler(event)))
  }

  const subscribe = <TData>(event: string, _: string, handler: Handler<TData>) => {
    if (!handlers[event]) {
      handlers[event] = []
    }

    handlers[event].push(handler as Handler)
  }

  return { emit, subscribe, waitEvents }
}
