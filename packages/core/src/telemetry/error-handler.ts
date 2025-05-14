import { context, trace, SpanStatusCode } from '@opentelemetry/api';

export function recordException(error: Error, metadata?: Record<string, unknown>): void {
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
}

export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    recordException(error, { 
      type: 'uncaughtException',
      timestamp: Date.now(),
      process_id: process.pid,
    });
    console.error('Uncaught Exception:', error);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    let error: Error;
    if (reason instanceof Error) {
      error = reason;
    } else {
      error = new Error(String(reason));
      error.name = 'UnhandledRejection';
      
      // Capture the original non-Error reason
      if (reason !== null && reason !== undefined) {
        Object.defineProperty(error, 'originalReason', {
          value: reason,
          enumerable: false,
        });
      }
    }
    
    recordException(error, { 
      type: 'unhandledRejection',
      timestamp: Date.now(),
      process_id: process.pid,
      promise: String(promise),
    });
    
    console.error('Unhandled Rejection:', reason);
  });
} 