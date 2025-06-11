import { TraceBuilder } from './trace-builder'
import { ObservabilityStream } from './observability-stream'

export class ObservabilityLogger {
  private readonly traceId: string
  private readonly step: string
  private readonly traceBuilder: TraceBuilder;

  constructor(traceId: string, step: string, observabilityStream: ObservabilityStream) {
    this.traceId = traceId
    this.step = step
    this.traceBuilder = new TraceBuilder(observabilityStream)
  }

  async logStepStart(stepName: string, correlationId?: string): Promise<void> {
    await this.traceBuilder.handleStepStart({
      eventType: 'step_start',
      traceId: this.traceId,
      correlationId,
      stepName,
      timestamp: Date.now()
    })
  }

  async logStepEnd(
    stepName: string,
    duration: number,
    success: boolean,
    error?: { message: string; code?: string | number },
  ): Promise<void> {
    await this.traceBuilder.handleStepEnd({
      eventType: 'step_end',
      traceId: this.traceId,
      stepName,
      duration,
      metadata: { success, error },
      timestamp: Date.now(),
    })
  }

  async logStateOperation(
    stepName: string,
    operation: 'get' | 'set' | 'delete' | 'clear',
    key?: string,
    success: boolean = true,
  ): Promise<void> {
    await this.traceBuilder.handleOperation({
      eventType: 'state_op',
      traceId: this.traceId,
      stepName,
      metadata: { operation, key, success },
      timestamp: Date.now(),
    })
  }

  async logEmitOperation(stepName: string, topic: string, success: boolean = true): Promise<void> {
    await this.traceBuilder.handleOperation({
      eventType: 'emit_op',
      traceId: this.traceId,
      stepName,
      metadata: { topic, success },
      timestamp: Date.now(),
    })
  }

  async logStreamOperation(
    stepName: string,
    streamName: string,
    operation: 'get' | 'set' | 'delete' | 'clear',
    success: boolean = true,
  ): Promise<void> {
    await this.traceBuilder.handleOperation({
      eventType: 'stream_op',
      traceId: this.traceId,
      stepName,
      metadata: { streamName, operation, success },
      timestamp: Date.now(),
    })
  }

  async logCorrelationStart(
    correlationId: string,
    correlationMethod: 'automatic' | 'manual' | 'state-based' | 'event-based',
  ): Promise<void> {
    await this.traceBuilder.handleCorrelationStart({
      eventType: 'correlation_start',
      traceId: this.traceId,
      correlationId,
      stepName: this.step,
      metadata: { correlationMethod },
      timestamp: Date.now(),
    })
  }

  async logCorrelationContinue(correlationId: string, parentTraceId: string): Promise<void> {
    await this.traceBuilder.handleCorrelationContinue({
      eventType: 'correlation_continue',
      traceId: this.traceId,
      correlationId,
      parentTraceId,
      stepName: this.step,
      timestamp: Date.now(),
    })
  }
} 