import { TraceBuilder } from './trace-builder'
import { ObservabilityLogger } from './observability-logger'
import { Trace, TraceGroup, TraceFilter, TraceSearchResult } from './types'
import { StreamAdapter } from '../streams/adapters/stream-adapter'

export class ObservabilityService {
  private traceBuilder: TraceBuilder

  constructor(private readonly observabilityStream: StreamAdapter<any>, maxTraceAgeMs: number = 24 * 60 * 60 * 1000) {
    this.traceBuilder = new TraceBuilder(observabilityStream, maxTraceAgeMs)
  }

  createObservabilityLogger(
    traceId: string,
    flows: string[] | undefined,
    step: string,
    isVerbose: boolean,
    logStream?: StreamAdapter<any>,
  ): ObservabilityLogger {
    return new ObservabilityLogger(
      traceId,
      flows,
      step,
      isVerbose,
      logStream,
      async (event) => {
        try {
          await this.traceBuilder.processEvent(event)
        } catch (error) {
          console.error('Error processing observability event:', error)
        }
      }
    )
  }

  async getTrace(traceId: string): Promise<Trace | undefined> {
    return await this.traceBuilder.getTrace(traceId)
  }

  async getTraceWithDetails(traceId: string): Promise<Trace | undefined> {
    return await this.traceBuilder.getTraceWithDetails(traceId)
  }

  async getTraceGroup(correlationId: string): Promise<TraceGroup | undefined> {
    return await this.traceBuilder.getTraceGroup(correlationId)
  }

  async searchTraces(filter: TraceFilter = {}): Promise<TraceSearchResult> {
    return await this.traceBuilder.searchTraces(filter)
  }

  async getAllTraces(): Promise<Trace[]> {
    return await this.traceBuilder.getAllTraces()
  }

  async getAllTraceGroups(): Promise<TraceGroup[]> {
    return await this.traceBuilder.getAllTraceGroups()
  }

  async correlateTrace(traceId: string, correlationId: string, method: 'automatic' | 'manual' | 'state-based' | 'event-based' = 'manual', context?: any): Promise<void> {
    await this.traceBuilder.processEvent({
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

  async continueCorrelation(traceId: string, correlationId: string, parentTraceId: string): Promise<void> {
    await this.traceBuilder.processEvent({
      eventType: 'correlation_continue',
      traceId,
      correlationId,
      parentTraceId,
      stepName: 'system',
      timestamp: Date.now()
    })
  }

  // Static factory method for creating instances
  static create(observabilityStream: StreamAdapter<any>, maxTraceAgeMs?: number): ObservabilityService {
    return new ObservabilityService(observabilityStream, maxTraceAgeMs)
  }
}

// Export a factory function for creating the service with proper dependencies
export const createObservabilityService = (observabilityStream: StreamAdapter<any>, maxTraceAgeMs?: number): ObservabilityService => {
  return new ObservabilityService(observabilityStream, maxTraceAgeMs)
}

// Note: observabilityService instance should be created with proper dependencies in the application setup 