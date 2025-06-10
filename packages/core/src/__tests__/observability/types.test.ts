import { 
  Trace, 
  TraceStep, 
  TraceGroup, 
  ObservabilityEvent, 
  TraceFilter, 
  TraceSearchResult,
  StateOperation,
  EmitOperation,
  StreamOperation,
  LogEntry,
  TraceStepDetails
} from '../../observability/types'

describe('Observability Types', () => {
  describe('Trace', () => {
    it('should create valid trace object', () => {
      const trace: Trace = {
        id: 'trace-123',
        flowName: 'user-registration',
        status: 'running',
        startTime: Date.now(),
        entryPoint: { type: 'api', stepName: 'register-user' },
        steps: [],
        metadata: {
          totalSteps: 0,
          completedSteps: 0,
          errorCount: 0
        }
      }

      expect(trace.id).toBe('trace-123')
      expect(trace.flowName).toBe('user-registration')
      expect(trace.status).toBe('running')
      expect(trace.entryPoint.type).toBe('api')
      expect(trace.steps).toEqual([])
      expect(trace.metadata.totalSteps).toBe(0)
    })

    it('should handle optional trace properties', () => {
      const trace: Trace = {
        id: 'trace-456',
        flowName: 'order-processing',
        status: 'completed',
        startTime: Date.now() - 1000,
        duration: 1000,
        correlationId: 'corr-123',
        parentTraceId: 'parent-trace',
        entryPoint: { type: 'event', stepName: 'order-received' },
        steps: [],
                 metadata: {
           totalSteps: 2,
           completedSteps: 2,
           errorCount: 0,
           isChildTrace: true
         }
      }

      expect(trace.duration).toBe(1000)
      expect(trace.correlationId).toBe('corr-123')
             expect(trace.parentTraceId).toBe('parent-trace')
       expect(trace.metadata.isChildTrace).toBe(true)
    })
  })

  describe('TraceStep', () => {
    it('should create step with required properties', () => {
      const step: TraceStep = {
        name: 'validate-input',
        status: 'running',
        operations: { state: 1, emit: 0, stream: 2 }
      }

      expect(step.name).toBe('validate-input')
      expect(step.status).toBe('running')
      expect(step.operations.state).toBe(1)
      expect(step.operations.stream).toBe(2)
    })

    it('should handle optional step properties', () => {
      const step: TraceStep = {
        name: 'process-payment',
        status: 'failed',
        startTime: 100,
        duration: 500,
        operations: { state: 2, emit: 1, stream: 0 },
        error: { message: 'Payment declined', code: 'PAYMENT_DECLINED' },
        details: {
          stateOperations: [],
          emitOperations: [],
          streamOperations: [],
          logs: []
        }
      }

      expect(step.startTime).toBe(100)
      expect(step.duration).toBe(500)
      expect(step.error?.message).toBe('Payment declined')
      expect(step.error?.code).toBe('PAYMENT_DECLINED')
      expect(step.details).toBeDefined()
    })
  })

  describe('TraceGroup', () => {
    it('should create trace group', () => {
      const group: TraceGroup = {
        id: 'group-123',
        correlationId: 'corr-123',
        name: 'Order Processing Flow',
        status: 'active',
        startTime: Date.now(),
        lastActivity: Date.now(),
        traces: [],
        metadata: {
          totalTraces: 3,
          completedTraces: 1,
          activeTraces: 2,
          totalSteps: 15,
          averageStepDuration: 250,
          gapsCount: 0,
          totalGapDuration: 0
        }
      }

      expect(group.correlationId).toBe('corr-123')
      expect(group.name).toBe('Order Processing Flow')
      expect(group.metadata.totalTraces).toBe(3)
      expect(group.metadata.activeTraces).toBe(2)
    })

    it('should handle optional group properties', () => {
      const group: TraceGroup = {
        id: 'group-456',
        correlationId: 'corr-456',
        name: 'Payment Flow',
        status: 'completed',
        startTime: Date.now() - 5000,
        lastActivity: Date.now() - 1000,
        totalDuration: 4000,
        traces: [],
                 metadata: {
           totalTraces: 2,
           completedTraces: 2,
           activeTraces: 0,
           totalSteps: 8,
           averageStepDuration: 500,
           gapsCount: 1,
           totalGapDuration: 200
         }
      }

             expect(group.totalDuration).toBe(4000)
    })
  })

  describe('ObservabilityEvent', () => {
    it('should create step_start event', () => {
      const event: ObservabilityEvent = {
        eventType: 'step_start',
        traceId: 'trace-123',
        stepName: 'api-step',
        timestamp: Date.now()
      }

      expect(event.eventType).toBe('step_start')
      expect(event.traceId).toBe('trace-123')
      expect(event.stepName).toBe('api-step')
    })

    it('should create step_end event with metadata', () => {
      const event: ObservabilityEvent = {
        eventType: 'step_end',
        traceId: 'trace-456',
        stepName: 'process-step',
        timestamp: Date.now(),
        duration: 1500,
        metadata: {
          success: false,
          error: { message: 'Step failed', code: 500 }
        }
      }

      expect(event.eventType).toBe('step_end')
      expect(event.duration).toBe(1500)
      expect(event.metadata?.success).toBe(false)
      expect(event.metadata?.error?.message).toBe('Step failed')
    })

    it('should create operation events', () => {
      const stateEvent: ObservabilityEvent = {
        eventType: 'state_op',
        traceId: 'trace-789',
        stepName: 'data-step',
        timestamp: Date.now(),
        metadata: {
          operation: 'set',
          key: 'user-data',
          success: true
        }
      }

      const emitEvent: ObservabilityEvent = {
        eventType: 'emit_op',
        traceId: 'trace-789',
        stepName: 'notify-step',
        timestamp: Date.now(),
        metadata: {
          topic: 'user-created',
          success: true
        }
      }

      const streamEvent: ObservabilityEvent = {
        eventType: 'stream_op',
        traceId: 'trace-789',
        stepName: 'log-step',
        timestamp: Date.now(),
        metadata: {
          streamName: 'audit-log',
          operation: 'set',
          success: true
        }
      }

      expect(stateEvent.metadata?.operation).toBe('set')
      expect(stateEvent.metadata?.key).toBe('user-data')
      expect(emitEvent.metadata?.topic).toBe('user-created')
      expect(streamEvent.metadata?.streamName).toBe('audit-log')
      expect(streamEvent.metadata?.operation).toBe('set')
    })

    it('should create correlation events', () => {
      const correlationStartEvent: ObservabilityEvent = {
        eventType: 'correlation_start',
        traceId: 'trace-abc',
        correlationId: 'corr-123',
        stepName: 'system',
        timestamp: Date.now(),
        metadata: {
          correlationMethod: 'automatic',
          correlationContext: { sessionId: 'sess-456' }
        }
      }

      const correlationContinueEvent: ObservabilityEvent = {
        eventType: 'correlation_continue',
        traceId: 'trace-def',
        correlationId: 'corr-123',
        parentTraceId: 'trace-abc',
        stepName: 'system',
        timestamp: Date.now()
      }

      expect(correlationStartEvent.correlationId).toBe('corr-123')
      expect(correlationStartEvent.metadata?.correlationMethod).toBe('automatic')
      expect(correlationContinueEvent.parentTraceId).toBe('trace-abc')
    })
  })

  describe('Operation Types', () => {
    it('should create state operation', () => {
      const operation: StateOperation = {
        id: 'state-op-1',
        timestamp: Date.now(),
        operation: 'get',
        key: 'user-id',
        duration: 50,
        success: true,
        error: { message: 'Key not found', code: 'NOT_FOUND' }
      }

      expect(operation.operation).toBe('get')
      expect(operation.key).toBe('user-id')
      expect(operation.success).toBe(true)
      expect(operation.duration).toBe(50)
      expect(operation.error?.code).toBe('NOT_FOUND')
    })

    it('should create emit operation', () => {
      const operation: EmitOperation = {
        id: 'emit-op-1',
        timestamp: Date.now(),
        topic: 'order-placed',
        success: true,
        targetSteps: ['inventory-step', 'payment-step'],
        error: { message: 'No subscribers', code: 'NO_SUBS' }
      }

      expect(operation.topic).toBe('order-placed')
      expect(operation.targetSteps).toEqual(['inventory-step', 'payment-step'])
      expect(operation.success).toBe(true)
      expect(operation.error?.message).toBe('No subscribers')
    })

    it('should create stream operation', () => {
      const operation: StreamOperation = {
        id: 'stream-op-1',
        timestamp: Date.now(),
        operation: 'delete',
        streamName: 'temp-data',
        duration: 25,
        success: false,
        error: { message: 'Stream not found', code: 'STREAM_404' }
      }

      expect(operation.operation).toBe('delete')
      expect(operation.streamName).toBe('temp-data')
      expect(operation.success).toBe(false)
      expect(operation.duration).toBe(25)
      expect(operation.error?.code).toBe('STREAM_404')
    })

    it('should create log entry', () => {
      const logEntry: LogEntry = {
        id: 'log-1',
        timestamp: Date.now(),
        level: 'warn',
        message: 'High memory usage detected',
        metadata: { memoryUsage: '85%', threshold: '80%' }
      }

      expect(logEntry.level).toBe('warn')
      expect(logEntry.message).toBe('High memory usage detected')
      expect(logEntry.metadata?.memoryUsage).toBe('85%')
      expect(logEntry.metadata?.threshold).toBe('80%')
    })

    it('should handle different log levels', () => {
      const levels: Array<LogEntry['level']> = ['debug', 'info', 'warn', 'error']
      
      levels.forEach(level => {
        const logEntry: LogEntry = {
          id: `log-${level}`,
          timestamp: Date.now(),
          level,
          message: `${level} message`
        }
        
        expect(logEntry.level).toBe(level)
      })
    })
  })

  describe('TraceFilter', () => {
         it('should create filter with all options', () => {
       const filter: TraceFilter = {
         flowName: 'user-flow',
         status: 'completed',
         stepName: 'api-step',
         correlationId: 'corr-123',
         startTime: {
           from: Date.now() - 86400000, // 24 hours ago
           to: Date.now()
         },
         limit: 50
       }

       expect(filter.flowName).toBe('user-flow')
       expect(filter.status).toBe('completed')
       expect(filter.stepName).toBe('api-step')
       expect(filter.correlationId).toBe('corr-123')
       expect(filter.limit).toBe(50)
       expect(filter.startTime).toBeDefined()
     })

    it('should handle empty filter', () => {
      const filter: TraceFilter = {}
      
      expect(filter.flowName).toBeUndefined()
      expect(filter.status).toBeUndefined()
      expect(filter.limit).toBeUndefined()
    })
  })

  describe('TraceSearchResult', () => {
    it('should create search result', () => {
      const result: TraceSearchResult = {
        traces: [],
        groups: [],
        total: 0,
        hasMore: false
      }

      expect(result.traces).toEqual([])
      expect(result.groups).toEqual([])
      expect(result.total).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    it('should handle search result with data', () => {
      const mockTrace: Trace = {
        id: 'trace-1',
        flowName: 'test-flow',
        status: 'completed',
        startTime: Date.now(),
        entryPoint: { type: 'api', stepName: 'test-step' },
        steps: [],
        metadata: {
          totalSteps: 1,
          completedSteps: 1,
          errorCount: 0
        }
      }

      const mockGroup: TraceGroup = {
        id: 'group-1',
        correlationId: 'corr-1',
        name: 'Test Group',
        status: 'completed',
        startTime: Date.now(),
        lastActivity: Date.now(),
        traces: [mockTrace],
        metadata: {
          totalTraces: 1,
          completedTraces: 1,
          activeTraces: 0,
          totalSteps: 1,
          averageStepDuration: 100,
          gapsCount: 0,
          totalGapDuration: 0
        }
      }

      const result: TraceSearchResult = {
        traces: [mockTrace],
        groups: [mockGroup],
        total: 2,
        hasMore: true
      }

      expect(result.traces).toHaveLength(1)
      expect(result.groups).toHaveLength(1)
      expect(result.total).toBe(2)
      expect(result.hasMore).toBe(true)
    })
  })

  describe('Type validation', () => {
         it('should validate trace status values', () => {
       const validStatuses: Array<Trace['status']> = ['running', 'completed', 'failed']
      
      validStatuses.forEach(status => {
        const trace: Trace = {
          id: 'test',
          flowName: 'test',
          status,
          startTime: Date.now(),
          entryPoint: { type: 'api', stepName: 'test' },
          steps: [],
          metadata: { totalSteps: 0, completedSteps: 0, errorCount: 0 }
        }
        
        expect(trace.status).toBe(status)
      })
    })

    it('should validate entry point types', () => {
      const validTypes: Array<Trace['entryPoint']['type']> = ['api', 'cron', 'event']
      
      validTypes.forEach(type => {
        const trace: Trace = {
          id: 'test',
          flowName: 'test',
          status: 'running',
          startTime: Date.now(),
          entryPoint: { type, stepName: 'test-step' },
          steps: [],
          metadata: { totalSteps: 0, completedSteps: 0, errorCount: 0 }
        }
        
        expect(trace.entryPoint.type).toBe(type)
      })
    })

    it('should validate state operation types', () => {
      const validOperations: Array<StateOperation['operation']> = ['get', 'set', 'delete', 'clear']
      
      validOperations.forEach(operation => {
        const stateOp: StateOperation = {
          id: 'test',
          timestamp: Date.now(),
          operation,
          success: true
        }
        
        expect(stateOp.operation).toBe(operation)
      })
    })

    it('should validate stream operation types', () => {
      const validOperations: Array<StreamOperation['operation']> = ['get', 'set', 'delete']
      
      validOperations.forEach(operation => {
        const streamOp: StreamOperation = {
          id: 'test',
          timestamp: Date.now(),
          operation,
          streamName: 'test-stream',
          success: true
        }
        
        expect(streamOp.operation).toBe(operation)
      })
    })
  })
}) 