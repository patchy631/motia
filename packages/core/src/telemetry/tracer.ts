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
import { isTelemetryEnabled, sanitizeAttributes } from './utils';
import type { MotiaTracer } from './types';



export const createTracer = (name: string): MotiaTracer => {
  const tracer: Tracer = trace.getTracer(name);
  const enabled = isTelemetryEnabled();

  const startSpan = (name: string, options?: SpanOptions): Span => {
    if (!enabled) {
      return trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
    }
    
    return tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      ...options,
    });
  }

  const getCurrentSpan = (): Span | undefined => {
    return trace.getSpan(context.active());
  }

  const startActiveSpan = <T>(
    name: string,
    callback: (span: Span) => T,
    options?: SpanOptions,
  ): T => {
    if (!enabled) {
      const noopSpan = trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
      return callback(noopSpan);
    }
    
    return tracer.startActiveSpan(
      name,
      { kind: SpanKind.INTERNAL, ...options },
      callback,
    );
  }

  const withSpan = <T>(span: Span, callback: () => T): T => {
    const ctx: Context = trace.setSpan(context.active(), span);
    return context.with(ctx, callback);
  }

  const recordException = (exception: Error, span?: Span): void => {
    if (!enabled) return;
    
    const activeSpan = span || getCurrentSpan();
    if (activeSpan && activeSpan.isRecording()) {
      activeSpan.recordException(exception);
      activeSpan.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
      
      activeSpan.setAttribute(ATTR_EXCEPTION_TYPE, exception.name);
      activeSpan.setAttribute(ATTR_EXCEPTION_MESSAGE, exception.message);
      
      if (exception.stack) {
        activeSpan.setAttribute(ATTR_EXCEPTION_STACKTRACE, exception.stack);
      }
    }
  }

  const addEvent = (name: string, attributes?: Attributes, span?: Span): void => {
    if (!enabled) return;
    
    const activeSpan = span || getCurrentSpan();
    if (activeSpan && activeSpan.isRecording()) {
      activeSpan.addEvent(name, attributes);
    }
  }

  const setAttributes = (attributes: Attributes, span?: Span): void => {
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
  
  const isRecording = (span?: Span): boolean => {
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