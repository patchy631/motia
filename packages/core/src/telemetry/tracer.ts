import { 
  trace, 
  context, 
  Context, 
  Span, 
  SpanKind, 
  SpanOptions, 
  SpanStatusCode, 
  Tracer, 
  Attributes, 
  INVALID_SPAN_CONTEXT
} from '@opentelemetry/api';
import { ATTR_EXCEPTION_MESSAGE, ATTR_EXCEPTION_STACKTRACE, ATTR_EXCEPTION_TYPE } from '@opentelemetry/semantic-conventions';

export interface MotiaTracer {
  startSpan: (name: string, options?: SpanOptions) => Span;
  startActiveSpan: <T>(name: string, callback: (span: Span) => T, options?: SpanOptions) => T;
  getCurrentSpan: () => Span | undefined;
  withSpan: <T>(span: Span, callback: () => T) => T;
  recordException: (exception: Error, span?: Span) => void;
  addEvent: (name: string, attributes?: Attributes, span?: Span) => void;
  setAttributes: (attributes: Attributes, span?: Span) => void;
  isRecording: (span?: Span) => boolean;
}

const sanitizeAttributes = (attributes: Attributes): Attributes => {
  const result: Attributes = {};
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    
    // Handle objects by converting to string - prevent serialization errors
    if (typeof value === 'object' && !Array.isArray(value)) {
      try {
        result[key] = JSON.stringify(value);
      } catch (e) {
        result[key] = String(value);
      }
    } else if (
      typeof value === 'string' || 
      typeof value === 'number' || 
      typeof value === 'boolean' || 
      Array.isArray(value)
    ) {
      result[key] = value as Attributes[keyof Attributes];
    } else {
      result[key] = String(value);
    }
  });
  
  return result;
};

export function createTracer(name: string): MotiaTracer {
  const tracer: Tracer = trace.getTracer(name);
  const enabled = process.env.MOTIA_TELEMETRY_ENABLED !== 'false';

  function startSpan(name: string, options?: SpanOptions): Span {
    if (!enabled) {
      // Return a no-op span when disabled
      return trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
    }
    
    return tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      ...options,
    });
  }

  function getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  function startActiveSpan<T>(
    name: string,
    callback: (span: Span) => T,
    options?: SpanOptions,
  ): T {
    if (!enabled) {
      // Skip span creation but still call the callback
      const noopSpan = trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
      return callback(noopSpan);
    }
    
    return tracer.startActiveSpan(
      name,
      { kind: SpanKind.INTERNAL, ...options },
      callback,
    );
  }

  function withSpan<T>(span: Span, callback: () => T): T {
    const ctx: Context = trace.setSpan(context.active(), span);
    return context.with(ctx, callback);
  }

  function recordException(exception: Error, span?: Span): void {
    if (!enabled) return;
    
    const activeSpan = span || getCurrentSpan();
    if (activeSpan && activeSpan.isRecording()) {
      activeSpan.recordException(exception);
      activeSpan.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
      
      // Add standard error attributes following semantic conventions
      activeSpan.setAttribute(ATTR_EXCEPTION_TYPE, exception.name);
      activeSpan.setAttribute(ATTR_EXCEPTION_MESSAGE, exception.message);
      
      if (exception.stack) {
        activeSpan.setAttribute(ATTR_EXCEPTION_STACKTRACE, exception.stack);
      }
    }
  }

  function addEvent(name: string, attributes?: Attributes, span?: Span): void {
    if (!enabled) return;
    
    const activeSpan = span || getCurrentSpan();
    if (activeSpan && activeSpan.isRecording()) {
      activeSpan.addEvent(name, attributes);
    }
  }

  function setAttributes(attributes: Attributes, span?: Span): void {
    if (!enabled) return;
    
    const activeSpan = span || getCurrentSpan();
    if (activeSpan && activeSpan.isRecording()) {
      const sanitizedAttrs = sanitizeAttributes(attributes);
      Object.entries(sanitizedAttrs).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          activeSpan.setAttribute(key, value);
        }
      });
    }
  }
  
  function isRecording(span?: Span): boolean {
    if (!enabled) return false;
    
    const activeSpan = span || getCurrentSpan();
    return !!(activeSpan && activeSpan.isRecording());
  }

  return {
    startSpan,
    startActiveSpan,
    getCurrentSpan,
    withSpan,
    recordException,
    addEvent,
    setAttributes,
    isRecording,
  };
} 