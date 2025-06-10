import { Logger } from '../logger'
import { ObservabilityEvent } from './types'
import { StreamAdapter } from '../streams/adapters/stream-adapter'

export class ObservabilityLogger extends Logger {
  private processEvent?: (event: ObservabilityEvent) => Promise<void>
  protected readonly observabilityTraceId: string
  protected readonly observabilityFlows: string[] | undefined
  protected readonly observabilityStep: string

  constructor(
    traceId: string,
    flows: string[] | undefined,
    step: string,
    isVerbose: boolean,
    logStream?: StreamAdapter<any>,
    processEvent?: (event: ObservabilityEvent) => Promise<void>
  ) {
    super(traceId, flows, step, isVerbose, logStream)
    this.processEvent = processEvent
    this.observabilityTraceId = traceId
    this.observabilityFlows = flows
    this.observabilityStep = step
  }

  child(meta: Record<string, unknown> = {}): this {
    return new ObservabilityLogger(
      this.observabilityTraceId,
      this.observabilityFlows,
      meta.step as string,
      this.isVerbose,
      (this as any).logStream,
      this.processEvent
    ) as this
  }

  private async emitObservabilityEvent(event: Omit<ObservabilityEvent, 'timestamp'>): Promise<void> {
    if (!this.processEvent) return

    const observabilityEvent: ObservabilityEvent = {
      ...event,
      timestamp: Date.now()
    }

    try {
      await this.processEvent(observabilityEvent)
    } catch (error) {
      console.error('Error processing observability event:', error)
    }
  }

  async logStepStart(stepName: string, correlationId?: string): Promise<void> {
    await this.emitObservabilityEvent({
      eventType: 'step_start',
      traceId: this.observabilityTraceId,
      correlationId,
      stepName
    })
    this.debug(`Step started: ${stepName}`)
  }

  async logStepEnd(stepName: string, duration: number, success: boolean, error?: { message: string, code?: string | number }): Promise<void> {
    await this.emitObservabilityEvent({
      eventType: 'step_end',
      traceId: this.observabilityTraceId,
      stepName,
      duration,
      metadata: { success, error }
    })
    
    if (success) {
      this.debug(`Step completed: ${stepName} (${duration}ms)`)
    } else {
      this.error(`Step failed: ${stepName} (${duration}ms)`, error)
    }
  }

  async logStateOperation(stepName: string, operation: 'get' | 'set' | 'delete' | 'clear', key?: string, success: boolean = true): Promise<void> {
    await this.emitObservabilityEvent({
      eventType: 'state_op',
      traceId: this.observabilityTraceId,
      stepName,
      metadata: { operation, key, success }
    })
  }

  async logEmitOperation(stepName: string, topic: string, success: boolean = true): Promise<void> {
    await this.emitObservabilityEvent({
      eventType: 'emit_op',
      traceId: this.observabilityTraceId,
      stepName,
      metadata: { topic, success }
    })
  }

  async logStreamOperation(stepName: string, streamName: string, operation: 'get' | 'set' | 'delete' | 'clear', success: boolean = true): Promise<void> {
    await this.emitObservabilityEvent({
      eventType: 'stream_op',
      traceId: this.observabilityTraceId,
      stepName,
      metadata: { streamName, operation, success }
    })
  }

  async logCorrelationStart(correlationId: string, correlationMethod: 'automatic' | 'manual' | 'state-based' | 'event-based', context?: any): Promise<void> {
    await this.emitObservabilityEvent({
      eventType: 'correlation_start',
      traceId: this.observabilityTraceId,
      correlationId,
      stepName: this.observabilityStep,
      metadata: { correlationMethod, correlationContext: context }
    })
  }

  async logCorrelationContinue(correlationId: string, parentTraceId: string): Promise<void> {
    await this.emitObservabilityEvent({
      eventType: 'correlation_continue',
      traceId: this.observabilityTraceId,
      correlationId,
      parentTraceId,
      stepName: this.observabilityStep
    })
  }
} 