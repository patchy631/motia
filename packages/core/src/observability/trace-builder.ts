import { ObservabilityEvent, Trace, TraceStep, TraceGroup, TraceFilter, TraceSearchResult, TraceStepDetails, StateOperation, EmitOperation, StreamOperation, LogEntry } from './types'
import { StreamAdapter } from '../streams/adapters/stream-adapter'

export class TraceBuilder {
  private observabilityStream: StreamAdapter<any> // Using any to handle both Trace and TraceGroup
  private maxTraceAgeMs: number // Time-based eviction instead of count-based

  constructor(observabilityStream: StreamAdapter<any>, maxTraceAgeMs: number = 24 * 60 * 60 * 1000) { // Default: 24 hours
    this.observabilityStream = observabilityStream
    this.maxTraceAgeMs = maxTraceAgeMs
  }

  async processEvent(event: ObservabilityEvent): Promise<Trace> {
    try {
      switch (event.eventType) {
        case 'step_start':
          await this.handleStepStart(event)
          break
        case 'step_end':
          await this.handleStepEnd(event)
          break
        case 'state_op':
        case 'emit_op':
        case 'stream_op':
          await this.handleOperation(event)
          break
        case 'correlation_start':
          await this.handleCorrelationStart(event)
          break
        case 'correlation_continue':
          await this.handleCorrelationContinue(event)
          break
      }

      // Periodically clean up old traces
      await this.evictOldTraces()
      
      const trace = await this.getTrace(event.traceId)
      if (!trace) {
        throw new Error(`Trace ${event.traceId} not found after processing`)
      }
      return trace
    } catch (error) {
      console.error('Error processing observability event:', error)
      // Return a basic trace if processing fails
      return this.createNewTrace(event)
    }
  }

  private async handleStepStart(event: ObservabilityEvent): Promise<void> {
    let trace = await this.getTrace(event.traceId)
    
    if (!trace) {
      trace = this.createNewTrace(event)
      await this.saveTrace(trace)
    }

    const existingStep = trace.steps.find(s => s.name === event.stepName)
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
          logs: []
        }
      }
      trace.steps.push(step)
      trace.metadata.totalSteps = trace.steps.length
    } else {
      existingStep.status = 'running'
      existingStep.startTime = event.timestamp - trace.startTime
      // Reset operation counts when step restarts
      existingStep.operations = { state: 0, emit: 0, stream: 0 }
      
      // Reset step details when step restarts
      existingStep.details = {
        stateOperations: [],
        emitOperations: [],
        streamOperations: [],
        logs: []
      }
    }

    trace.status = 'running'
    await this.saveTrace(trace)
    await this.updateTraceGroup(trace)
  }

  private async handleStepEnd(event: ObservabilityEvent): Promise<void> {
    const trace = await this.getTrace(event.traceId)
    if (!trace) return

    const step = trace.steps.find(s => s.name === event.stepName)
    if (!step) return

    step.status = event.metadata?.success ? 'completed' : 'failed'
    step.duration = event.duration
    
    if (!event.metadata?.success) {
      trace.metadata.errorCount++
      if (event.metadata?.error) {
        step.error = event.metadata.error
      }
    }

    if (step.status === 'completed') {
      trace.metadata.completedSteps++
    }

    const allStepsCompleted = trace.steps.every(s => s.status === 'completed' || s.status === 'failed')
    if (allStepsCompleted) {
      trace.status = trace.metadata.errorCount > 0 ? 'failed' : 'completed'
      trace.duration = event.timestamp - trace.startTime
    }

    await this.saveTrace(trace)
    await this.updateTraceGroup(trace)
  }

  private async handleOperation(event: ObservabilityEvent): Promise<void> {
    const trace = await this.getTrace(event.traceId)
    if (!trace) return

    const step = trace.steps.find(s => s.name === event.stepName)
    if (!step || !step.details) return

    switch (event.eventType) {
      case 'state_op':
        step.operations.state++
        const stateOp: StateOperation = {
          id: `${event.traceId}-${event.stepName}-state-${step.details.stateOperations.length}`,
          timestamp: event.timestamp,
          operation: event.metadata?.operation as any || 'get',
          key: event.metadata?.key,
          duration: event.duration,
          success: event.metadata?.success ?? true,
          error: event.metadata?.error
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
          error: event.metadata?.error
        }
        step.details.emitOperations.push(emitOp)
        break
      case 'stream_op':
        step.operations.stream++
        const streamOp: StreamOperation = {
          id: `${event.traceId}-${event.stepName}-stream-${step.details.streamOperations.length}`,
          timestamp: event.timestamp,
          operation: event.metadata?.operation as any || 'get',
          streamName: event.metadata?.streamName || 'unknown',
          duration: event.duration,
          success: event.metadata?.success ?? true,
          error: event.metadata?.error
        }
        step.details.streamOperations.push(streamOp)
        break
    }

    await this.saveTrace(trace)
  }

  private async handleCorrelationStart(event: ObservabilityEvent): Promise<void> {
    if (!event.correlationId) return

    const trace = await this.getTrace(event.traceId)
    if (!trace) return

    trace.correlationId = event.correlationId

    let group = await this.getTraceGroup(event.correlationId)
    if (!group) {
      group = this.createNewTraceGroup(event.correlationId, trace)
    }

    if (!group.traces.find(t => t.id === trace.id)) {
      group.traces.push(trace)
      this.updateTraceGroupMetadata(group)
    }

    await this.saveTrace(trace)
    await this.saveTraceGroup(group)
  }

  private async handleCorrelationContinue(event: ObservabilityEvent): Promise<void> {
    if (!event.correlationId || !event.parentTraceId) return

    const trace = await this.getTrace(event.traceId)
    if (!trace) return

    trace.correlationId = event.correlationId
    trace.parentTraceId = event.parentTraceId
    trace.metadata.isChildTrace = true

    const group = await this.getTraceGroup(event.correlationId)
    if (group && !group.traces.find(t => t.id === trace.id)) {
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
        isChildTrace: !!event.parentTraceId
      }
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
        totalGapDuration: 0
      }
    }
  }

  private async updateTraceGroup(trace: Trace): Promise<void> {
    if (!trace.correlationId) return

    const group = await this.getTraceGroup(trace.correlationId)
    if (!group) return

    group.lastActivity = Date.now()
    
    // Update the trace in the group
    const traceIndex = group.traces.findIndex(t => t.id === trace.id)
    if (traceIndex >= 0) {
      group.traces[traceIndex] = trace
    }
    
    this.updateTraceGroupMetadata(group)
    await this.saveTraceGroup(group)
  }

  private updateTraceGroupMetadata(group: TraceGroup): void {
    const completedTraces = group.traces.filter(t => t.status === 'completed' || t.status === 'failed')
    const activeTraces = group.traces.filter(t => t.status === 'running')

    group.metadata.totalTraces = group.traces.length
    group.metadata.completedTraces = completedTraces.length
    group.metadata.activeTraces = activeTraces.length
    group.metadata.totalSteps = group.traces.reduce((sum, t) => sum + t.metadata.totalSteps, 0)

    if (completedTraces.length > 0) {
      const totalDuration = completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0)
      group.metadata.averageStepDuration = totalDuration / completedTraces.length
    }

    if (activeTraces.length === 0 && completedTraces.length > 0) {
      group.status = group.traces.some(t => t.status === 'failed') ? 'failed' : 'completed'
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

  private async evictOldTraces(): Promise<void> {
    try {
      const cutoffTime = Date.now() - this.maxTraceAgeMs
      const allTraces = await this.getAllTraces()
      
      const tracesToRemove = allTraces.filter(trace => trace.startTime < cutoffTime)
      
      for (const trace of tracesToRemove) {
        await this.observabilityStream.delete('traces', trace.id)
        
        // Clean up trace groups that may now be empty
        if (trace.correlationId) {
          const group = await this.getTraceGroup(trace.correlationId)
          if (group) {
            group.traces = group.traces.filter(t => t.id !== trace.id)
            if (group.traces.length === 0) {
              await this.observabilityStream.delete('groups', trace.correlationId)
            } else {
              await this.saveTraceGroup(group)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during trace eviction:', error)
    }
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

  async getTrace(traceId: string): Promise<Trace | undefined> {
    try {
      const result = await this.observabilityStream.get('traces', traceId)
      return result || undefined
    } catch (error) {
      console.error('Error getting trace:', error)
      return undefined
    }
  }

  async getTraceGroup(correlationId: string): Promise<TraceGroup | undefined> {
    try {
      const result = await this.observabilityStream.get('groups', correlationId)
      return result || undefined
    } catch (error) {
      console.error('Error getting trace group:', error)
      return undefined
    }
  }

  async searchTraces(filter: TraceFilter = {}): Promise<TraceSearchResult> {
    try {
      let traces = await this.getAllTraces()
      let groups = await this.getAllTraceGroups()

      if (filter.flowName) {
        traces = traces.filter(t => t.flowName.includes(filter.flowName!))
        groups = groups.filter(g => g.traces.some(t => t.flowName.includes(filter.flowName!)))
      }

      if (filter.status) {
        traces = traces.filter(t => t.status === filter.status)
        groups = groups.filter(g => g.status === filter.status)
      }

      if (filter.stepName) {
        traces = traces.filter(t => t.steps.some(s => s.name.includes(filter.stepName!)))
      }

      if (filter.correlationId) {
        traces = traces.filter(t => t.correlationId === filter.correlationId)
        groups = groups.filter(g => g.correlationId === filter.correlationId)
      }

      if (filter.startTime) {
        if (filter.startTime.from) {
          traces = traces.filter(t => t.startTime >= filter.startTime!.from!)
          groups = groups.filter(g => g.startTime >= filter.startTime!.from!)
        }
        if (filter.startTime.to) {
          traces = traces.filter(t => t.startTime <= filter.startTime!.to!)
          groups = groups.filter(g => g.startTime <= filter.startTime!.to!)
        }
      }

      traces.sort((a, b) => b.startTime - a.startTime)
      groups.sort((a, b) => b.lastActivity - a.lastActivity)

      const limit = filter.limit || 20
      const hasMore = traces.length > limit || groups.length > limit

      return {
        traces: traces.slice(0, limit),
        groups: groups.slice(0, limit),
        total: traces.length + groups.length,
        hasMore
      }
    } catch (error) {
      console.error('Error searching traces:', error)
      return { traces: [], groups: [], total: 0, hasMore: false }
    }
  }

  async getAllTraces(): Promise<Trace[]> {
    try {
      const traces = await this.observabilityStream.getGroup('traces')
      return traces.sort((a, b) => b.startTime - a.startTime)
    } catch (error) {
      console.error('Error getting all traces:', error)
      return []
    }
  }

  async getAllTraceGroups(): Promise<TraceGroup[]> {
    try {
      const groups = await this.observabilityStream.getGroup('groups')
      return groups.sort((a, b) => b.lastActivity - a.lastActivity)
    } catch (error) {
      console.error('Error getting all trace groups:', error)
      return []
    }
  }

  async getTraceWithDetails(traceId: string): Promise<Trace | undefined> {
    // Since details are now embedded in the trace steps, this is simplified
    return await this.getTrace(traceId)
  }

  async addLogEntry(traceId: string, stepName: string, logEntry: Omit<LogEntry, 'id'>): Promise<void> {
    try {
      const trace = await this.getTrace(traceId)
      if (!trace) return

      const step = trace.steps.find(s => s.name === stepName)
      if (!step || !step.details) return

      const fullLogEntry: LogEntry = {
        ...logEntry,
        id: `${traceId}-${stepName}-log-${step.details.logs.length}`
      }

      step.details.logs.push(fullLogEntry)
      await this.saveTrace(trace)
    } catch (error) {
      console.error('Error adding log entry:', error)
    }
  }

  // New method to manually clean up old traces
  async cleanupOldTraces(): Promise<void> {
    await this.evictOldTraces()
  }
} 