import { globalLogger, Logger } from './logger'
import { Event, EventManager, Handler } from './../wistro.types'

export const createEventManager = (globalSubscriber?: (event: Event<unknown>) => void): EventManager => {
  const handlers: Record<string, Handler[]> = {}

  const emit = async <TData>(event: Event<TData>, file?: string) => {
    // Add debug logging
    globalLogger.debug('[EventManager] Emitting event', {
      type: event.type,
      traceId: event.traceId,
      flows: event.flows,
      file,
    })

    globalSubscriber?.(event)

    const eventHandlers = handlers[event.type] ?? []
    const { logger, ...rest } = event

    logger.debug('[Flow Emit] Event emitted', {
      handlers: eventHandlers.length,
      data: rest,
      file,
      traceId: event.traceId,
    })

    // Make sure we preserve traceId and flows when calling handlers
    eventHandlers.map((handler) =>
      handler({
        ...event,
        traceId: event.traceId,
        flows: event.flows,
      }),
    )
  }

  const subscribe = <TData>(event: string, handlerName: string, handler: Handler<TData>) => {
    if (!handlers[event]) {
      handlers[event] = []
    }

    globalLogger.debug('[Flow Sub] Subscribing to event', {
      event,
      handlerName,
    })

    handlers[event].push(handler as Handler)
  }

  return { emit, subscribe }
}
