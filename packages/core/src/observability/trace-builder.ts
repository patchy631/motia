import {
  EmitOperation,
  ObservabilityEvent,
  StateOperation,
  StreamOperation,
  Trace,
  TraceGroup,
  TraceStep,
} from './types'
import { ObservabilityStream } from './observability-stream'

export class TraceBuilder {
  private observabilityStream: ObservabilityStream

  constructor(observabilityStream: ObservabilityStream) {
    this.observabilityStream = observabilityStream
  }

  public async handleStepStart(event: ObservabilityEvent): Promise<void> {
    let trace = await this.getTrace(event.traceId)

    if (!trace) {
      trace = this.createNewTrace(event)
      await this.saveTrace(trace)
    }

    const existingStep = trace.steps.find((s) => s.name === event.stepName)
    if (!existingStep) {
      const step: TraceStep = {
        name: event.stepName,
        status: 'running',
        startTime: event.timestamp - trace.startTime,
        operations: { state: 0, emit: 0, stream: 0 },
        details: {
          stateOperations: [],
          emitOperations: [],
          streamOperations: [],
          logs: [],
        },
      }
      trace.steps.push(step)
      trace.metadata.totalSteps = trace.steps.length
    } else {
      existingStep.status = 'running'
      existingStep.startTime = event.timestamp - trace.startTime
      existingStep.operations = { state: 0, emit: 0, stream: 0 }
      existingStep.details = {
        stateOperations: [],
        emitOperations: [],
        streamOperations: [],
        logs: [],
      }
    }

    trace.status = 'running'
    await this.saveTrace(trace)
    await this.updateTraceGroup(trace)
  }

  public async handleStepEnd(event: ObservabilityEvent): Promise<void> {
    const trace = await this.getTrace(event.traceId)
    if (!trace) return

    const step = trace.steps.find((s) => s.name === event.stepName)
    if (!step) return

    if(step.status !== 'running') return

    step.status = event.metadata?.success ? 'completed' : 'failed'
    step.duration = event.duration

    if (!event.metadata?.success) {
      trace.metadata.errorCount++
      if (event.metadata?.error) {
        step.error = event.metadata.error
      }
    }

    if (step.status === 'completed') {
      console.log(step.name, 'completed', step)
      trace.metadata.completedSteps++
    }

    const allStepsCompleted = trace.steps.every((s) => s.status === 'completed' || s.status === 'failed')
    if (allStepsCompleted) {
      trace.status = trace.metadata.errorCount > 0 ? 'failed' : 'completed'
      trace.duration = event.timestamp - trace.startTime
    }

    await this.saveTrace(trace)
    await this.updateTraceGroup(trace)
  }

  public async handleOperation(event: ObservabilityEvent): Promise<void> {
    const trace = await this.getTrace(event.traceId)
    if (!trace) return

    const step = trace.steps.find((s) => s.name === event.stepName)
    if (!step || !step.details) return

    switch (event.eventType) {
      case 'state_op':
        step.operations.state++
        const stateOp: StateOperation = {
          id: `${event.traceId}-${event.stepName}-state-${step.details.stateOperations.length}`,
          timestamp: event.timestamp,
          operation: event.metadata?.operation || 'get',
          key: event.metadata?.key,
          duration: event.duration,
          success: event.metadata?.success ?? true,
          error: event.metadata?.error,
        }
        step.details.stateOperations.push(stateOp)
        break
      case 'emit_op':
        step.operations.emit++
        const emitOp: EmitOperation = {
          id: `${event.traceId}-${event.stepName}-emit-${step.details.emitOperations.length}`,
          timestamp: event.timestamp,
          topic: event.metadata?.topic || 'unknown',
          success: event.metadata?.success ?? true,
          error: event.metadata?.error,
        }
        step.details.emitOperations.push(emitOp)
        break
      case 'stream_op':
        step.operations.stream++
        const streamOp: StreamOperation = {
          id: `${event.traceId}-${event.stepName}-stream-${step.details.streamOperations.length}`,
          timestamp: event.timestamp,
          operation: event.metadata?.operation || 'get',
          streamName: event.metadata?.streamName || 'unknown',
          duration: event.duration,
          success: event.metadata?.success ?? true,
          error: event.metadata?.error,
        }
        step.details.streamOperations.push(streamOp)
        break
    }

    await this.saveTrace(trace)
  }

  public async handleCorrelationStart(event: ObservabilityEvent): Promise<void> {
    if (!event.correlationId) return

    const trace = await this.getTrace(event.traceId)
    if (!trace) return

    trace.correlationId = event.correlationId

    let group = await this.getTraceGroup(event.correlationId)
    if (!group) {
      group = this.createNewTraceGroup(event.correlationId, trace)
    }

    if (!group.traces.find((t) => t.id === trace.id)) {
      group.traces.push(trace)
      this.updateTraceGroupMetadata(group)
    }

    await this.saveTrace(trace)
    await this.saveTraceGroup(group)
  }

  public async handleCorrelationContinue(event: ObservabilityEvent): Promise<void> {
    if (!event.correlationId || !event.parentTraceId) return

    const trace = await this.getTrace(event.traceId)
    if (!trace) return

    trace.correlationId = event.correlationId
    trace.parentTraceId = event.parentTraceId
    trace.metadata.isChildTrace = true

    const group = await this.getTraceGroup(event.correlationId)
    if (group && !group.traces.find((t) => t.id === trace.id)) {
      group.traces.push(trace)
      this.updateTraceGroupMetadata(group)
      await this.saveTraceGroup(group)
    }

    await this.saveTrace(trace)
  }

  private createNewTrace(event: ObservabilityEvent): Trace {
    const flowName = this.extractFlowName(event)
    const entryPointType = this.determineEntryPointType(event)

    return {
      id: event.traceId,
      correlationId: event.correlationId,
      parentTraceId: event.parentTraceId,
      flowName,
      status: 'running',
      startTime: event.timestamp,
      entryPoint: { type: entryPointType, stepName: event.stepName },
      steps: [],
      metadata: {
        totalSteps: 0,
        completedSteps: 0,
        errorCount: 0,
        isChildTrace: !!event.parentTraceId,
      },
    }
  }

  private createNewTraceGroup(correlationId: string, initialTrace: Trace): TraceGroup {
    return {
      id: correlationId,
      correlationId,
      name: this.generateGroupName(initialTrace),
      status: 'active',
      startTime: initialTrace.startTime,
      lastActivity: initialTrace.startTime,
      traces: [initialTrace],
      metadata: {
        totalTraces: 1,
        completedTraces: 0,
        activeTraces: 1,
        totalSteps: 0,
        averageStepDuration: 0,
        gapsCount: 0,
        totalGapDuration: 0,
      },
    }
  }

  private async updateTraceGroup(trace: Trace): Promise<void> {
    if (!trace.correlationId) return

    const group = await this.getTraceGroup(trace.correlationId)
    if (!group) return

    group.lastActivity = Date.now()

    // Update the trace in the group
    const traceIndex = group.traces.findIndex((t) => t.id === trace.id)
    if (traceIndex >= 0) {
      group.traces[traceIndex] = trace
    }

    this.updateTraceGroupMetadata(group)
    await this.saveTraceGroup(group)
  }

  private updateTraceGroupMetadata(group: TraceGroup): void {
    const completedTraces = group.traces.filter((t) => t.status === 'completed' || t.status === 'failed')
    const activeTraces = group.traces.filter((t) => t.status === 'running')

    group.metadata.totalTraces = group.traces.length
    group.metadata.completedTraces = completedTraces.length
    group.metadata.activeTraces = activeTraces.length
    group.metadata.totalSteps = group.traces.reduce((sum, t) => sum + t.metadata.totalSteps, 0)

    if (completedTraces.length > 0) {
      const totalDuration = completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0)
      group.metadata.averageStepDuration = totalDuration / completedTraces.length
    }

    if (activeTraces.length === 0 && completedTraces.length > 0) {
      group.status = group.traces.some((t) => t.status === 'failed') ? 'failed' : 'completed'
      group.totalDuration = group.lastActivity - group.startTime
    }
  }

  private extractFlowName(event: ObservabilityEvent): string {
    return event.stepName.split('-')[0] || 'unknown-flow'
  }

  private determineEntryPointType(event: ObservabilityEvent): 'api' | 'cron' | 'event' {
    if (event.stepName.includes('api') || event.stepName.includes('endpoint')) return 'api'
    if (event.stepName.includes('cron') || event.stepName.includes('schedule')) return 'cron'
    return 'event'
  }

  private generateGroupName(trace: Trace): string {
    return `${trace.flowName} Flow`
  }

  private async saveTrace(trace: Trace): Promise<void> {
    try {
      await this.observabilityStream.set('traces', trace.id, trace)
    } catch (error) {
      console.error('Error saving trace:', error)
    }
  }

  private async saveTraceGroup(group: TraceGroup): Promise<void> {
    try {
      await this.observabilityStream.set('groups', group.correlationId, group)
    } catch (error) {
      console.error('Error saving trace group:', error)
    }
  }

  async getTrace(traceId: string): Promise<Trace | null> {
    try {
      const result = await this.observabilityStream.get<Trace>('traces', traceId)
      return result
    } catch (error) {
      console.error('Error getting trace:', error)
      return null
    }
  }

  async getTraceGroup(correlationId: string): Promise<TraceGroup | null> {
    try {
      const result = await this.observabilityStream.get<TraceGroup>('groups', correlationId)
      return result
    } catch (error) {
      console.error('Error getting trace group:', error)
      return null
    }
  }

  async getAllTraces(): Promise<Trace[]> {
    try {
      const traces = await this.observabilityStream.getGroup<Trace>('traces')
      return traces.sort((a, b) => b.startTime - a.startTime)
    } catch (error) {
      console.error('Error getting all traces:', error)
      return []
    }
  }
}