import { TraceBuilder } from '../../observability/trace-builder'
import { createMockObservabilityEvent, createMockTrace, MockObservabilityStream } from '../fixtures/observability-fixtures'
import { ObservabilityEvent } from '../../observability/types'

describe('TraceBuilder', () => {
  let traceBuilder: TraceBuilder
  let mockStream: MockObservabilityStream

  beforeEach(() => {
    mockStream = new MockObservabilityStream()
    traceBuilder = new TraceBuilder(mockStream, 24 * 60 * 60 * 1000) // 24 hours
  })

  describe('constructor', () => {
    it('should initialize with correct max trace age', () => {
      const customMaxAge = 2 * 60 * 60 * 1000 // 2 hours
      const builder = new TraceBuilder(mockStream, customMaxAge)
      expect(builder['maxTraceAgeMs']).toBe(customMaxAge)
    })

    it('should use default max trace age if not provided', () => {
      const builder = new TraceBuilder(mockStream)
      expect(builder['maxTraceAgeMs']).toBe(24 * 60 * 60 * 1000)
    })
  })

  describe('processEvent - step_start', () => {
    it('should create new trace and step on first step_start event', async () => {
      const baseTime = Date.now()
      const event = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: baseTime
      })

      await traceBuilder.processEvent(event)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace).toBeDefined()
      expect(trace!.id).toBe('trace-1')
      expect(trace!.status).toBe('running')
      expect(trace!.steps).toHaveLength(1)
      expect(trace!.steps[0].name).toBe('api-step')
      expect(trace!.steps[0].status).toBe('running')
    })

    it('should add new step to existing trace', async () => {
      const baseTime = Date.now()
      const startEvent1 = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: baseTime
      })

      const startEvent2 = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'process-step',
        timestamp: baseTime + 500
      })

      await traceBuilder.processEvent(startEvent1)
      await traceBuilder.processEvent(startEvent2)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.steps).toHaveLength(2)
      expect(trace!.steps[1].name).toBe('process-step')
      expect(trace!.metadata.totalSteps).toBe(2)
    })

    it('should restart existing step if step_start received again', async () => {
      const baseTime = Date.now()
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: baseTime
      })

      const restartEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: baseTime + 1000
      })

      await traceBuilder.processEvent(startEvent)
      await traceBuilder.processEvent(restartEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.steps).toHaveLength(1)
      expect(trace!.steps[0].status).toBe('running')
      expect(trace!.steps[0].operations).toEqual({ state: 0, emit: 0, stream: 0 })
    })

    it('should extract flow name and entry point from event', async () => {
      const baseTime = Date.now()
      const event = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'order-flow-123',
        stepName: 'api-order-create',
        timestamp: baseTime
      })

      await traceBuilder.processEvent(event)

      const trace = await traceBuilder.getTrace('order-flow-123')
      expect(trace!.flowName).toBe('api')
      expect(trace!.entryPoint.type).toBe('api')
      expect(trace!.entryPoint.stepName).toBe('api-order-create')
    })
  })

  describe('processEvent - step_end', () => {
    beforeEach(async () => {
      const baseTime = Date.now()
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: baseTime
      })
      await traceBuilder.processEvent(startEvent)
    })

    it('should complete step successfully', async () => {
      const baseTime = Date.now()
      const endEvent = createMockObservabilityEvent({
        eventType: 'step_end',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: baseTime + 1000,
        duration: 1000,
        metadata: { success: true }
      })

      await traceBuilder.processEvent(endEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].status).toBe('completed')
      expect(trace!.steps[0].duration).toBe(1000)
      expect(trace!.metadata.completedSteps).toBe(1)
      expect(trace!.status).toBe('completed')
    })

    it('should handle step failure', async () => {
      const baseTime = Date.now()
      const endEvent = createMockObservabilityEvent({
        eventType: 'step_end',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: baseTime + 1000,
        duration: 1000,
        metadata: { 
          success: false, 
          error: { message: 'Step failed', code: 500 }
        }
      })

      await traceBuilder.processEvent(endEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].status).toBe('failed')
      expect(trace!.steps[0].error).toEqual({ message: 'Step failed', code: 500 })
      expect(trace!.metadata.errorCount).toBe(1)
      expect(trace!.status).toBe('failed')
    })

    it('should set trace duration when all steps complete', async () => {
      const baseTime = Date.now()
      const endEvent = createMockObservabilityEvent({
        eventType: 'step_end',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: baseTime + 500,
        duration: 500,
        metadata: { success: true }
      })

      await traceBuilder.processEvent(endEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      // Allow for minor timing variations due to async operations
      expect(trace!.duration).toBeGreaterThanOrEqual(500)
      expect(trace!.duration).toBeLessThan(510)
      expect(trace!.status).toBe('completed')
    })

    it('should not complete trace if step not found', async () => {
      const baseTime = Date.now()
      const endEvent = createMockObservabilityEvent({
        eventType: 'step_end',
        traceId: 'trace-1',
        stepName: 'non-existent-step',
        timestamp: baseTime + 1000,
        duration: 1000,
        metadata: { success: true }
      })

      await traceBuilder.processEvent(endEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.status).toBe('running')
      expect(trace!.metadata.completedSteps).toBe(0)
    })
  })

  describe('processEvent - operations', () => {
    beforeEach(async () => {
      const baseTime = Date.now()
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: baseTime
      })
      await traceBuilder.processEvent(startEvent)
    })

    it('should handle state operations', async () => {
      const baseTime = Date.now()
      const stateEvent = createMockObservabilityEvent({
        eventType: 'state_op',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: baseTime + 500,
        metadata: { operation: 'set', key: 'test-key', success: true }
      })

      await traceBuilder.processEvent(stateEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].operations.state).toBe(1)

      const traceWithDetails = await traceBuilder.getTraceWithDetails('trace-1')
      const stateOps = traceWithDetails!.steps[0].details!.stateOperations
      expect(stateOps).toHaveLength(1)
      expect(stateOps[0].operation).toBe('set')
      expect(stateOps[0].key).toBe('test-key')
      expect(stateOps[0].success).toBe(true)
    })

    it('should handle emit operations', async () => {
      const baseTime = Date.now()
      const emitEvent = createMockObservabilityEvent({
        eventType: 'emit_op',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: baseTime + 500,
        metadata: { topic: 'test-topic', success: true }
      })

      await traceBuilder.processEvent(emitEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].operations.emit).toBe(1)

      const traceWithDetails = await traceBuilder.getTraceWithDetails('trace-1')
      const emitOps = traceWithDetails!.steps[0].details!.emitOperations
      expect(emitOps).toHaveLength(1)
      expect(emitOps[0].topic).toBe('test-topic')
      expect(emitOps[0].success).toBe(true)
    })

    it('should handle stream operations', async () => {
      const baseTime = Date.now()
      const streamEvent = createMockObservabilityEvent({
        eventType: 'stream_op',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: baseTime + 500,
        metadata: { streamName: 'test-stream', operation: 'get', success: true }
      })

      await traceBuilder.processEvent(streamEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].operations.stream).toBe(1)

      const traceWithDetails = await traceBuilder.getTraceWithDetails('trace-1')
      const streamOps = traceWithDetails!.steps[0].details!.streamOperations
      expect(streamOps).toHaveLength(1)
      expect(streamOps[0].streamName).toBe('test-stream')
      expect(streamOps[0].operation).toBe('get')
      expect(streamOps[0].success).toBe(true)
    })

    it('should ignore operations for non-existent traces', async () => {
      const baseTime = Date.now()
      const stateEvent = createMockObservabilityEvent({
        eventType: 'state_op',
        traceId: 'non-existent-trace',
        stepName: 'test-step',
        timestamp: baseTime + 500,
        metadata: { operation: 'set', key: 'test-key', success: true }
      })

      await traceBuilder.processEvent(stateEvent)

      const trace = await traceBuilder.getTrace('non-existent-trace')
      expect(trace).toBeUndefined()
    })

    it('should ignore operations for non-existent steps', async () => {
      const baseTime = Date.now()
      const stateEvent = createMockObservabilityEvent({
        eventType: 'state_op',
        traceId: 'trace-1',
        stepName: 'non-existent-step',
        timestamp: baseTime + 500,
        metadata: { operation: 'set', key: 'test-key', success: true }
      })

      await traceBuilder.processEvent(stateEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].operations.state).toBe(0)
    })
  })

  describe('correlation handling', () => {
    beforeEach(async () => {
      const baseTime = Date.now()
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: baseTime
      })
      await traceBuilder.processEvent(startEvent)
    })

    it('should handle correlation start', async () => {
      const baseTime = Date.now()
      const correlationEvent = createMockObservabilityEvent({
        eventType: 'correlation_start',
        traceId: 'trace-1',
        correlationId: 'corr-123',
        stepName: 'system',
        timestamp: baseTime,
        metadata: {
          correlationMethod: 'manual',
          correlationContext: { userId: 'user-123' }
        }
      })

      await traceBuilder.processEvent(correlationEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.correlationId).toBe('corr-123')

      const group = await traceBuilder.getTraceGroup('corr-123')
      expect(group).toBeDefined()
      expect(group!.traces).toHaveLength(1)
      expect(group!.traces[0].id).toBe('trace-1')
    })

    it('should handle correlation continue', async () => {
      // Set up parent trace first - need to create the parent with step_start first
      const baseTime = Date.now()
      const parentStartEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'parent-trace',
        stepName: 'parent-step',
        timestamp: baseTime
      })
      
      await traceBuilder.processEvent(parentStartEvent)
      
      const parentCorrelationEvent = createMockObservabilityEvent({
        eventType: 'correlation_start',
        traceId: 'parent-trace',
        correlationId: 'corr-123',
        stepName: 'system',
        timestamp: baseTime
      })
      
      await traceBuilder.processEvent(parentCorrelationEvent)

      // Create the child trace first with step_start
      const childStartEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'child-step',
        timestamp: baseTime
      })
      
      await traceBuilder.processEvent(childStartEvent)

      const continueEvent = createMockObservabilityEvent({
        eventType: 'correlation_continue',
        traceId: 'trace-1',
        correlationId: 'corr-123',
        parentTraceId: 'parent-trace',
        stepName: 'system',
        timestamp: baseTime
      })

      await traceBuilder.processEvent(continueEvent)

      const trace = await traceBuilder.getTrace('trace-1')
      expect(trace!.correlationId).toBe('corr-123')
      expect(trace!.parentTraceId).toBe('parent-trace')

      const group = await traceBuilder.getTraceGroup('corr-123')
      expect(group!.traces).toHaveLength(2)
    })

    it('should add multiple traces to the same correlation group', async () => {
      const baseTime = Date.now()
      const events = [
        createMockObservabilityEvent({
          eventType: 'correlation_start',
          traceId: 'trace-1',
          correlationId: 'corr-123',
          stepName: 'system',
          timestamp: baseTime
        }),
        createMockObservabilityEvent({
          eventType: 'step_start',
          traceId: 'trace-2',
          stepName: 'process-step',
          timestamp: baseTime + 500
        }),
        createMockObservabilityEvent({
          eventType: 'correlation_continue',
          traceId: 'trace-2',
          correlationId: 'corr-123',
          parentTraceId: 'trace-1',
          stepName: 'system',
          timestamp: baseTime + 500
        })
      ]

      for (const event of events) {
        await traceBuilder.processEvent(event)
      }

      const group = await traceBuilder.getTraceGroup('corr-123')
      expect(group!.traces).toHaveLength(2)
      expect(group!.metadata.totalTraces).toBe(2)
    })
  })

  describe('search functionality', () => {
    beforeEach(async () => {
      // Create multiple traces with different characteristics
      const baseTime = Date.now()
      const traces = [
        { traceId: 'completed-trace', status: 'completed', correlationId: 'corr-1' },
        { traceId: 'failed-trace', status: 'failed', correlationId: 'corr-2' },
        { traceId: 'running-trace', status: 'running', correlationId: null }
      ]

      for (const { traceId, status, correlationId } of traces) {
        const startEvent = createMockObservabilityEvent({
          eventType: 'step_start',
          traceId,
          stepName: 'test-step',
          timestamp: baseTime
        })
        await traceBuilder.processEvent(startEvent)

        if (status !== 'running') {
          const endEvent = createMockObservabilityEvent({
            eventType: 'step_end',
            traceId,
            stepName: 'test-step',
            timestamp: baseTime + 1000,
            duration: 1000,
            metadata: { success: status === 'completed' }
          })
          await traceBuilder.processEvent(endEvent)
        }

        if (correlationId) {
          const corrEvent = createMockObservabilityEvent({
            eventType: 'correlation_start',
            traceId,
            correlationId,
            stepName: 'system',
            timestamp: baseTime
          })
          await traceBuilder.processEvent(corrEvent)
        }
      }
    })

    it('should search traces by status', async () => {
      const result = await traceBuilder.searchTraces({ status: 'completed' })
      expect(result.traces).toHaveLength(1)
      expect(result.traces[0].id).toBe('completed-trace')
    })

    it('should search traces by correlation ID', async () => {
      const result = await traceBuilder.searchTraces({ correlationId: 'corr-1' })
      expect(result.traces).toHaveLength(1)
      expect(result.traces[0].id).toBe('completed-trace')
    })

    it('should return all traces when no filter provided', async () => {
      const result = await traceBuilder.searchTraces()
      expect(result.traces).toHaveLength(3)
    })

    it('should return trace groups in search results', async () => {
      const result = await traceBuilder.searchTraces()
      expect(result.groups).toHaveLength(2) // corr-1 and corr-2
    })
  })

  describe('trace cleanup', () => {
    it('should evict old traces based on age', async () => {
      const baseTime = Date.now()
      const shortAgeBuilder = new TraceBuilder(mockStream, 1000) // 1 second
      
      const oldEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'old-trace',
        stepName: 'test-step',
        timestamp: baseTime - 2000 // 2 seconds ago
      })

      const newEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'new-trace',
        stepName: 'test-step',
        timestamp: baseTime
      })

      await shortAgeBuilder.processEvent(oldEvent)
      await shortAgeBuilder.processEvent(newEvent)

      const oldTrace = await shortAgeBuilder.getTrace('old-trace')
      const newTrace = await shortAgeBuilder.getTrace('new-trace')

      expect(oldTrace).toBeUndefined()
      expect(newTrace).toBeDefined()
    })

    it('should manually cleanup old traces', async () => {
      // Use a separate mock stream for this test to avoid interference
      const cleanupMockStream = new MockObservabilityStream()
      const cleanupBuilder = new TraceBuilder(cleanupMockStream, 24 * 60 * 60 * 1000) // 24 hours
      
      const baseTime = Date.now()
      const oldEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'old-trace',
        stepName: 'test-step',
        timestamp: baseTime - (25 * 60 * 60 * 1000) // 25 hours ago
      })

      // Directly save the trace to avoid evictOldTraces being called in processEvent
      const oldTrace = {
        id: 'old-trace',
        flowName: 'test',
        status: 'running' as const,
        startTime: baseTime - (25 * 60 * 60 * 1000),
        entryPoint: { type: 'api' as const, stepName: 'test-step' },
        steps: [],
        metadata: {
          totalSteps: 0,
          completedSteps: 0,
          errorCount: 0,
          isChildTrace: false
        }
      }
      
      await cleanupMockStream.set('traces', 'old-trace', oldTrace)
      
      let trace = await cleanupBuilder.getTrace('old-trace')
      expect(trace).toBeDefined()

      await cleanupBuilder.cleanupOldTraces()
      
      trace = await cleanupBuilder.getTrace('old-trace')
      expect(trace).toBeUndefined()
    })
  })

  describe('log entries', () => {
    beforeEach(async () => {
      const baseTime = Date.now()
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: baseTime
      })
      await traceBuilder.processEvent(startEvent)
    })

    it('should add log entries to trace steps', async () => {
      await traceBuilder.addLogEntry('trace-1', 'test-step', {
        timestamp: Date.now(),
        level: 'info',
        message: 'Test log message',
        metadata: { key: 'value' }
      })

      const traceWithDetails = await traceBuilder.getTraceWithDetails('trace-1')
      const logs = traceWithDetails!.steps[0].details!.logs
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Test log message')
      expect(logs[0].level).toBe('info')
      expect(logs[0].metadata).toEqual({ key: 'value' })
    })

    it('should ignore log entries for non-existent traces', async () => {
      await expect(
        traceBuilder.addLogEntry('non-existent', 'test-step', {
          timestamp: Date.now(),
          level: 'info',
          message: 'Test log message'
        })
      ).resolves.not.toThrow()
    })

    it('should ignore log entries for non-existent steps', async () => {
      await expect(
        traceBuilder.addLogEntry('trace-1', 'non-existent-step', {
          timestamp: Date.now(),
          level: 'info',
          message: 'Test log message'
        })
      ).resolves.not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle errors during event processing gracefully', async () => {
      // Mock stream to throw an error only on set operations, but allow get operations
      const errorStream = new MockObservabilityStream()
      jest.spyOn(errorStream, 'set').mockRejectedValue(new Error('Stream error'))
      // Also mock getGroup to avoid issues with evictOldTraces
      jest.spyOn(errorStream, 'getGroup').mockResolvedValue([])
      
      const errorBuilder = new TraceBuilder(errorStream)
      const baseTime = Date.now()
      const event = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'error-trace',
        stepName: 'test-step',
        timestamp: baseTime
      })

      const result = await errorBuilder.processEvent(event)
      
      // Should return a basic trace even if processing fails
      expect(result).toBeDefined()
      expect(result.id).toBe('error-trace')
      expect(result.flowName).toBe('test')
      expect(result.status).toBe('running')
    })

    it('should handle missing step details gracefully', async () => {
      // Start a step without details
      const baseTime = Date.now()
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: baseTime
      })
      await traceBuilder.processEvent(startEvent)

      // Manually remove details to simulate error condition
      const trace = await traceBuilder.getTrace('trace-1')
      if (trace && trace.steps[0]) {
        delete trace.steps[0].details
      }

      // Should not crash when processing operations
      const opEvent = createMockObservabilityEvent({
        eventType: 'state_op',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: baseTime + 500,
        metadata: { operation: 'set', key: 'test-key', success: true }
      })

      await expect(traceBuilder.processEvent(opEvent)).resolves.not.toThrow()
    })
  })

  describe('getAllTraces and getAllTraceGroups', () => {
    beforeEach(async () => {
      // Create test data
      const baseTime = Date.now()
      const events = [
        createMockObservabilityEvent({
          eventType: 'step_start',
          traceId: 'trace-1',
          stepName: 'test-step',
          timestamp: baseTime
        }),
        createMockObservabilityEvent({
          eventType: 'step_start',
          traceId: 'trace-2',
          stepName: 'test-step',
          timestamp: baseTime
        }),
        createMockObservabilityEvent({
          eventType: 'correlation_start',
          traceId: 'trace-1',
          correlationId: 'corr-1',
          stepName: 'system',
          timestamp: baseTime
        })
      ]

      for (const event of events) {
        await traceBuilder.processEvent(event)
      }
    })

    it('should get all traces', async () => {
      const traces = await traceBuilder.getAllTraces()
      expect(traces).toHaveLength(2)
      expect(traces.map(t => t.id)).toEqual(expect.arrayContaining(['trace-1', 'trace-2']))
    })

    it('should get all trace groups', async () => {
      const groups = await traceBuilder.getAllTraceGroups()
      expect(groups).toHaveLength(1)
      expect(groups[0].correlationId).toBe('corr-1')
    })
  })
}) 