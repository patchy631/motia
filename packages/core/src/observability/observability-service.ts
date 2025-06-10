import { TraceBuilder } from './trace-builder'
import { ObservabilityLogger } from './observability-logger'
import { Trace, TraceGroup, TraceFilter, TraceSearchResult } from './types'
import { StreamAdapter } from '../streams/adapters/stream-adapter'

export class ObservabilityService {
  private traceBuilder: TraceBuilder

  constructor(maxTraces: number = 50) {
    this.traceBuilder = new TraceBuilder(maxTraces)
  }

  createObservabilityLogger(
    traceId: string,
    flows: string[] | undefined,
    step: string,
    isVerbose: boolean,
    logStream?: StreamAdapter<any>,
    observabilityStream?: StreamAdapter<any>,
  ): ObservabilityLogger {
    return new ObservabilityLogger(
      traceId,
      flows,
      step,
      isVerbose,
      logStream,
      (event) => {
        const trace = this.traceBuilder.processEvent(event)
        if (observabilityStream) {
          observabilityStream.set('default', trace.id, trace);
        }
      }
    )
  }

  getTrace(traceId: string): Trace | undefined {
    return this.traceBuilder.getTrace(traceId)
  }

  getTraceWithDetails(traceId: string) {
    return this.traceBuilder.getTraceWithDetails(traceId)
  }

  getTraceGroup(correlationId: string): TraceGroup | undefined {
    return this.traceBuilder.getTraceGroup(correlationId)
  }

  searchTraces(filter: TraceFilter = {}): TraceSearchResult {
    return this.traceBuilder.searchTraces(filter)
  }

  getAllTraces(): Trace[] {
    return this.traceBuilder.getAllTraces()
  }

  getAllTraceGroups(): TraceGroup[] {
    return this.traceBuilder.getAllTraceGroups()
  }

  getStats() {
    return this.traceBuilder.getStats()
  }

  correlateTrace(traceId: string, correlationId: string, method: 'automatic' | 'manual' | 'state-based' | 'event-based' = 'manual', context?: any): void {
    this.traceBuilder.processEvent({
      eventType: 'correlation_start',
      traceId,
      correlationId,
      stepName: 'system',
      timestamp: Date.now(),
      metadata: {
        correlationMethod: method,
        correlationContext: context
      }
    })
  }

  continueCorrelation(traceId: string, correlationId: string, parentTraceId: string): void {
    this.traceBuilder.processEvent({
      eventType: 'correlation_continue',
      traceId,
      correlationId,
      parentTraceId,
      stepName: 'system',
      timestamp: Date.now()
    })
  }
}

export const observabilityService = new ObservabilityService() 