import { ObservabilityService, createObservabilityService } from '../../observability/observability-service'
import { MockObservabilityStream } from '../fixtures/observability-fixtures'

describe('Observability Module Integration', () => {
  let observabilityService: ObservabilityService
  let mockStream: MockObservabilityStream

  beforeEach(() => {
    mockStream = new MockObservabilityStream()
    observabilityService = createObservabilityService(mockStream)
  })

  describe('ObservabilityService factory', () => {
    it('should create service with provided stream', () => {
      const service = createObservabilityService(mockStream)
      expect(service).toBeInstanceOf(ObservabilityService)
    })

    it('should create service with custom max trace age', () => {
      const customMaxAge = 2 * 60 * 60 * 1000 // 2 hours
      const service = ObservabilityService.create(mockStream, customMaxAge)
      expect(service).toBeInstanceOf(ObservabilityService)
    })
  })

  describe('ObservabilityService functionality', () => {
    it('should provide all required methods', () => {
      expect(observabilityService.createObservabilityLogger).toBeInstanceOf(Function)
      expect(observabilityService.getTrace).toBeInstanceOf(Function)
      expect(observabilityService.getTraceWithDetails).toBeInstanceOf(Function)
      expect(observabilityService.getTraceGroup).toBeInstanceOf(Function)
      expect(observabilityService.searchTraces).toBeInstanceOf(Function)
      expect(observabilityService.getAllTraces).toBeInstanceOf(Function)
      expect(observabilityService.getAllTraceGroups).toBeInstanceOf(Function)
      expect(observabilityService.correlateTrace).toBeInstanceOf(Function)
      expect(observabilityService.continueCorrelation).toBeInstanceOf(Function)
    })

    it('should create observability loggers with proper configuration', () => {
      const logger = observabilityService.createObservabilityLogger(
        'test-trace-1',
        ['test-flow'],
        'test-step-1',
        false
      )

      expect(logger).toBeDefined()
      expect(logger.logStepStart).toBeInstanceOf(Function)
      expect(logger.logStepEnd).toBeInstanceOf(Function)
      expect(logger.logStateOperation).toBeInstanceOf(Function)
      expect(logger.logEmitOperation).toBeInstanceOf(Function)
      expect(logger.logStreamOperation).toBeInstanceOf(Function)
    })

    it('should maintain state across multiple logger instances', async () => {
      const logger1 = observabilityService.createObservabilityLogger(
        'global-test-1',
        ['integration-flow'],
        'test-step-1',
        false
      )

      const logger2 = observabilityService.createObservabilityLogger(
        'global-test-2',
        ['integration-flow'],
        'test-step-2',
        false
      )

      await logger1.logStepStart('step-1')
      await logger2.logStepStart('step-2')

      const traces = await observabilityService.getAllTraces()
      const trace1 = await observabilityService.getTrace('global-test-1')
      const trace2 = await observabilityService.getTrace('global-test-2')

      expect(traces.length).toBeGreaterThanOrEqual(2)
      expect(trace1).toBeDefined()
      expect(trace2).toBeDefined()
      expect(trace1!.id).toBe('global-test-1')
      expect(trace2!.id).toBe('global-test-2')
    })

    it('should handle trace retrieval operations', async () => {
      const logger = observabilityService.createObservabilityLogger(
        'trace-ops-test',
        ['test-flow'],
        'test-step',
        false
      )

      await logger.logStepStart('test-step')
      await logger.logStepEnd('test-step', 100, true)

      const trace = await observabilityService.getTrace('trace-ops-test')
      const traceWithDetails = await observabilityService.getTraceWithDetails('trace-ops-test')

      expect(trace).toBeDefined()
      expect(traceWithDetails).toBeDefined()
      expect(trace!.id).toBe('trace-ops-test')
      expect(traceWithDetails!.steps[0].details).toBeDefined()
    })

    it('should handle correlation operations', async () => {
      const correlationId = 'test-correlation-123'
      
      // Create traces first before correlating them
      const logger1 = observabilityService.createObservabilityLogger('trace-1', ['test-flow'], 'step-1', false)
      const logger2 = observabilityService.createObservabilityLogger('trace-2', ['test-flow'], 'step-2', false)
      
      await logger1.logStepStart('step-1')
      await logger2.logStepStart('step-2')
      
      await observabilityService.correlateTrace('trace-1', correlationId, 'manual', { userId: 'user-123' })
      await observabilityService.continueCorrelation('trace-2', correlationId, 'trace-1')

      const group = await observabilityService.getTraceGroup(correlationId)
      expect(group).toBeDefined()
      expect(group!.correlationId).toBe(correlationId)
    })

    it('should handle search operations', async () => {
      const logger = observabilityService.createObservabilityLogger(
        'search-test-trace',
        ['search-flow'],
        'search-step',
        false
      )

      await logger.logStepStart('search-step')
      await logger.logStepEnd('search-step', 200, true)

      const searchResult = await observabilityService.searchTraces({
        status: 'completed'
      })

      expect(searchResult).toBeDefined()
      expect(searchResult.traces).toBeDefined()
      expect(searchResult.groups).toBeDefined()
      expect(Array.isArray(searchResult.traces)).toBe(true)
      expect(Array.isArray(searchResult.groups)).toBe(true)
    })
  })

  describe('End-to-End Workflow', () => {
    it('should handle complete workflow with multiple operations', async () => {
      const correlationId = 'e2e-workflow-123'
      const workflowId = 'workflow-test'

      // Create loggers for different steps in the workflow
      const apiLogger = observabilityService.createObservabilityLogger(
        `${workflowId}-api`,
        ['order-processing'],
        'api-order-create',
        false
      )

      const processLogger = observabilityService.createObservabilityLogger(
        `${workflowId}-process`,
        ['order-processing'],
        'process-order',
        false
      )

      const notifyLogger = observabilityService.createObservabilityLogger(
        `${workflowId}-notify`,
        ['order-processing'],
        'notify-customer',
        false
      )

             // Simulate API step
       await apiLogger.logStepStart('api-order-create')
       await apiLogger.logStateOperation('api-order-create', 'get', 'customer-data', true)
       await apiLogger.logEmitOperation('api-order-create', 'order-created', true)
       await apiLogger.logStepEnd('api-order-create', 100, true)

      // Start correlation
      await observabilityService.correlateTrace(`${workflowId}-api`, correlationId)

             // Simulate processing step
       await processLogger.logStepStart('process-order')
       await processLogger.logStateOperation('process-order', 'get', 'inventory-data', true)
       await processLogger.logStateOperation('process-order', 'set', 'order-status', true)
       await processLogger.logStreamOperation('process-order', 'audit-log', 'set', true)
       await processLogger.logEmitOperation('process-order', 'order-processed', true)
       await processLogger.logStepEnd('process-order', 200, true)

      // Continue correlation
      await observabilityService.continueCorrelation(`${workflowId}-process`, correlationId, `${workflowId}-api`)

             // Simulate notification step
       await notifyLogger.logStepStart('notify-customer')
       await notifyLogger.logStateOperation('notify-customer', 'get', 'notification-template', true)
       await notifyLogger.logEmitOperation('notify-customer', 'notification-sent', true)
       await notifyLogger.logStepEnd('notify-customer', 150, true)

       // Continue correlation
       await observabilityService.continueCorrelation(`${workflowId}-notify`, correlationId, `${workflowId}-process`)

       // Verify the complete workflow
       const group = await observabilityService.getTraceGroup(correlationId)
       expect(group).toBeDefined()
       expect(group!.traces).toHaveLength(3)
       expect(group!.status).toBe('completed')

       const apiTrace = await observabilityService.getTraceWithDetails(`${workflowId}-api`)
       const processTrace = await observabilityService.getTraceWithDetails(`${workflowId}-process`)
       const notifyTrace = await observabilityService.getTraceWithDetails(`${workflowId}-notify`)

       expect(apiTrace!.status).toBe('completed')
       expect(processTrace!.status).toBe('completed')
       expect(notifyTrace!.status).toBe('completed')

       expect(apiTrace!.steps[0].details!.stateOperations).toHaveLength(1)
       expect(apiTrace!.steps[0].details!.emitOperations).toHaveLength(1)

       expect(processTrace!.steps[0].details!.stateOperations).toHaveLength(2)
       expect(processTrace!.steps[0].details!.emitOperations).toHaveLength(1)
       expect(processTrace!.steps[0].details!.streamOperations).toHaveLength(1)

       expect(notifyTrace!.steps[0].details!.stateOperations).toHaveLength(1)
       expect(notifyTrace!.steps[0].details!.emitOperations).toHaveLength(1)

       const searchResult = await observabilityService.searchTraces({
         correlationId,
         status: 'completed'
       })
       expect(searchResult.traces).toHaveLength(3)
       expect(searchResult.groups).toHaveLength(1)
     })

     it('should handle workflow with failures', async () => {
       const correlationId = 'failure-workflow-123'
       const workflowId = 'failure-test'

       const apiLogger = observabilityService.createObservabilityLogger(
         `${workflowId}-api`,
         ['failing-flow'],
         'api-step',
         false
       )

       const processLogger = observabilityService.createObservabilityLogger(
         `${workflowId}-process`,
         ['failing-flow'],
         'process-step',
         false
       )

       // Start successful API step
       await apiLogger.logStepStart('api-step')
       await apiLogger.logStateOperation('api-step', 'get', 'user-data', true)
       await apiLogger.logStepEnd('api-step', 100, true)

       // Start correlation
       await observabilityService.correlateTrace(`${workflowId}-api`, correlationId)

       // Start failing process step
       await processLogger.logStepStart('process-step')
       await processLogger.logStateOperation('process-step', 'get', 'invalid-data', false)
       await processLogger.logStepEnd('process-step', 75, false, {
         message: 'Data validation failed',
         code: 'VALIDATION_ERROR'
       })

      // Continue correlation
      await observabilityService.continueCorrelation(`${workflowId}-process`, correlationId, `${workflowId}-api`)

      const group = await observabilityService.getTraceGroup(correlationId)
      expect(group).toBeDefined()
      expect(group!.status).toBe('failed')
      expect(group!.traces).toHaveLength(2)

      const processTrace = await observabilityService.getTraceWithDetails(`${workflowId}-process`)
      expect(processTrace!.status).toBe('failed')
      expect(processTrace!.metadata.errorCount).toBe(1)
      expect(processTrace!.steps[0].error).toEqual({
        message: 'Data validation failed',
        code: 'VALIDATION_ERROR'
      })
    })

    it('should handle mixed correlation methods', async () => {
      const correlationId = 'mixed-correlation-123'

      // Create traces first before correlating them
      const manualLogger = observabilityService.createObservabilityLogger('manual-trace', ['test-flow'], 'manual-step', false)
      const autoLogger = observabilityService.createObservabilityLogger('auto-trace', ['test-flow'], 'auto-step', false)
      const stateLogger = observabilityService.createObservabilityLogger('state-trace', ['test-flow'], 'state-step', false)
      
      await manualLogger.logStepStart('manual-step')
      await autoLogger.logStepStart('auto-step')
      await stateLogger.logStepStart('state-step')

      // Manual correlation
      await observabilityService.correlateTrace('manual-trace', correlationId, 'manual')

      // Automatic correlation
      await observabilityService.correlateTrace('auto-trace', correlationId, 'automatic', { 
        triggerEvent: 'user-action' 
      })

      // State-based correlation
      await observabilityService.correlateTrace('state-trace', correlationId, 'state-based', {
        stateKey: 'user-session-id',
        stateValue: 'session-123'
      })

      const group = await observabilityService.getTraceGroup(correlationId)
      expect(group).toBeDefined()
      expect(group!.traces).toHaveLength(3)
    })
  })

  describe('Stream integration', () => {
    it('should trigger stream events when processing observability events', async () => {
      const logger = observabilityService.createObservabilityLogger(
        'stream-test',
        ['stream-flow'],
        'stream-step',
        false
      )

      await logger.logStepStart('stream-step')
      await logger.logStepEnd('stream-step', 100, true)

      const sendMock = mockStream.getSendMock()
      expect(sendMock).toHaveBeenCalled()
      
      // Should have been called at least twice (step start + step end)
      expect(sendMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    })

    it('should persist traces to stream', async () => {
      const logger = observabilityService.createObservabilityLogger(
        'persist-test',
        ['persist-flow'],
        'persist-step',
        false
      )

      await logger.logStepStart('persist-step')
      
      const streamData = mockStream.getData()
      expect(streamData.has('persist-test')).toBe(true)
      
      const persistedTrace = streamData.get('persist-test')
      expect(persistedTrace).toBeDefined()
      expect(persistedTrace!.id).toBe('persist-test')
    })
  })

  describe('Error handling and resilience', () => {
    it('should handle stream errors gracefully', async () => {
      // Create a logger that will trigger stream operations
      const logger = observabilityService.createObservabilityLogger(
        'error-test',
        ['error-flow'],
        'error-step',
        false
      )

      // Mock stream to fail
      jest.spyOn(mockStream, 'set').mockRejectedValueOnce(new Error('Stream failure'))

      // Should not throw despite stream error
      await expect(logger.logStepStart('error-step')).resolves.not.toThrow()
    })

    it('should handle concurrent operations', async () => {
      const promises: Promise<void>[] = []

      for (let i = 0; i < 5; i++) {
        const logger = observabilityService.createObservabilityLogger(
          `concurrent-${i}`,
          ['concurrent-flow'],
          'concurrent-step',
          false
        )

        promises.push(
          logger.logStepStart('concurrent-step').then(() =>
            logger.logStepEnd('concurrent-step', 100, true)
          )
        )
      }

      await Promise.all(promises)

      const traces = await observabilityService.getAllTraces()
      expect(traces.length).toBeGreaterThanOrEqual(5)
    })

    it('should handle large numbers of operations', async () => {
      const logger = observabilityService.createObservabilityLogger(
        'load-test',
        ['load-flow'],
        'load-step',
        false
      )

      await logger.logStepStart('load-step')

             // Log many operations
       const operationPromises: Promise<void>[] = []
       for (let i = 0; i < 100; i++) {
         operationPromises.push(
           logger.logStateOperation('load-step', 'set', `key-${i}`, true)
         )
       }

      await Promise.all(operationPromises)
      await logger.logStepEnd('load-step', 1000, true)

      const traceWithDetails = await observabilityService.getTraceWithDetails('load-test')
      expect(traceWithDetails!.steps[0].details!.stateOperations).toHaveLength(100)
      expect(traceWithDetails!.steps[0].operations.state).toBe(100)
    })
  })
}) 