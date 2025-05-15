import { context, trace, SpanStatusCode } from '@opentelemetry/api';

export const recordException = (error: Error, metadata?: Record<string, unknown>): void => {
  const span = trace.getSpan(context.active());
  if (!span || !span.isRecording()) {
    return;
  }

  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        span.setAttribute(`error.custom.${key}`, String(value));
      }
    });
  }
};

export const setupGlobalErrorHandlers = (): void => {
  setupUncaughtExceptionHandler();
  setupUnhandledRejectionHandler();
};

const setupUncaughtExceptionHandler = (): void => {
  process.on('uncaughtException', (error) => {
    recordException(error, { 
      type: 'uncaughtException',
      timestamp: Date.now(),
      process_id: process.pid,
    });
    console.error('Uncaught Exception:', error);
  });
};

const setupUnhandledRejectionHandler = (): void => {
  process.on('unhandledRejection', (reason, promise) => {
    const error = createErrorFromRejection(reason);
    
    recordException(error, { 
      type: 'unhandledRejection',
      timestamp: Date.now(),
      process_id: process.pid,
      promise: String(promise),
    });
    
    console.error('Unhandled Rejection:', reason);
  });
};

const createErrorFromRejection = (reason: unknown): Error => {
  if (reason instanceof Error) {
    return reason;
  }
  
  const error = new Error(String(reason));
  error.name = 'UnhandledRejection';
  
  if (reason !== null && reason !== undefined) {
    Object.defineProperty(error, 'originalReason', {
      value: reason,
      enumerable: false,
    });
  }
  
  return error;
}; 