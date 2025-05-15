import { globalLogger } from './logger'
import { Event, EventManager, Handler, SubscribeConfig, UnsubscribeConfig } from './types'
import type { Telemetry } from './telemetry/types'

type EventHandler = {
  filePath: string
  handler: Handler
}

export const createEventManager = (telemetry?: Telemetry): EventManager => {
  const handlers: Record<string, EventHandler[]> = {}

  const emit = async <TData>(event: Event<TData>, file?: string) => {
    const eventHandlers = handlers[event.topic] ?? []
    const { logger, ...rest } = event

    // Record event emission in telemetry
    const spanName = `event.emit.${event.topic}`
    return telemetry?.tracer.startActiveSpan<void>(spanName, () => {
      telemetry?.tracer.setAttributes({
        'event.topic': event.topic,
        'event.handlers.count': eventHandlers.length,
        'event.trace_id': event.traceId || '',
      });

      // Record metric for event emission
      telemetry?.metrics.incrementCounter('events.emitted', 1, {
        topic: event.topic,
      });

      logger.debug('[Flow Emit] Event emitted', { handlers: eventHandlers.length, data: rest, file })
      
      try {
        const handlersPromises = eventHandlers.map((eventHandler) => {
          return Promise.resolve().then(() => {
            const handlerSpanName = `event.handle.${event.topic}`
            return telemetry?.tracer.startActiveSpan(handlerSpanName, () => {
              telemetry?.tracer.setAttributes({
                'event.handler.file': eventHandler.filePath,
                'event.topic': event.topic,
              });
              
              try {
                const result = eventHandler.handler(event);
                return result;
              } catch (error) {
                if (error instanceof Error) {
                  telemetry?.tracer.recordException(error);
                  telemetry?.metrics.incrementCounter('events.errors', 1, {
                    topic: event.topic,
                    handler: eventHandler.filePath,
                    error: error.message,
                  });
                }
                throw error;
              }
            }, {});
          });
        });

        return Promise.all(handlersPromises);
      } catch (error) {
        if (error instanceof Error) {
          telemetry?.tracer.recordException(error);
        }
        throw error;
      }
    }, {});
  }

  const subscribe = <TData>(config: SubscribeConfig<TData>) => {
    const { event, handlerName, handler, filePath } = config

    if (!handlers[event]) {
      handlers[event] = []
    }

    // Record subscription in telemetry
    telemetry?.metrics.incrementCounter('events.subscriptions', 1, {
      topic: event,
      handler: handlerName,
    });

    globalLogger.debug('[Flow Sub] Subscribing to event', { event, handlerName })
    handlers[event].push({ filePath, handler: handler as Handler })
  }

  const unsubscribe = (config: UnsubscribeConfig) => {
    const { filePath, event } = config
    
    const previousCount = handlers[event]?.length || 0;
    handlers[event] = handlers[event]?.filter((handler) => handler.filePath !== filePath)
    const newCount = handlers[event]?.length || 0;
    
    // Record unsubscription in telemetry
    if (previousCount > newCount) {
      telemetry?.metrics.incrementCounter('events.unsubscriptions', 1, {
        topic: event,
      });
    }
  }

  return { emit, subscribe, unsubscribe }
}
