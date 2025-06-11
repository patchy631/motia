import { ObservabilityEvent, Trace, TraceGroup, TraceStep } from '../../observability/types'
import { BaseStreamItem } from '../../types-stream'
import { StreamAdapter } from '../../streams/adapters/stream-adapter'

export const createMockObservabilityEvent = (overrides: Partial<ObservabilityEvent> = {}): ObservabilityEvent => ({
  eventType: 'step_start',
  traceId: 'test-trace-123',
  stepName: 'test-step',
  timestamp: Date.now(),
  ...overrides
})

export const createMockTrace = (overrides: Partial<Trace> = {}): Trace => ({
  id: 'test-trace-123',
  flowName: 'test-flow',
  status: 'running',
  startTime: Date.now(),
  entryPoint: { type: 'api', stepName: 'test-api-step' },
  steps: [],
  metadata: {
    totalSteps: 0,
    completedSteps: 0,
    errorCount: 0
  },
  ...overrides
})

export const createMockTraceStep = (overrides: Partial<TraceStep> = {}): TraceStep => ({
  name: 'test-step',
  status: 'waiting',
  startTime: Date.now(),
  operations: { state: 0, emit: 0, stream: 0 },
  ...overrides
})

export const createMockTraceGroup = (overrides: Partial<TraceGroup> = {}): TraceGroup => ({
  id: 'test-correlation-123',
  correlationId: 'test-correlation-123',
  name: 'Test Flow Group',
  status: 'active',
  startTime: Date.now(),
  lastActivity: Date.now(),
  traces: [],
  metadata: {
    totalTraces: 0,
    completedTraces: 0,
    activeTraces: 0,
    totalSteps: 0,
    averageStepDuration: 0,
    gapsCount: 0,
    totalGapDuration: 0
  },
  ...overrides
})

export class MockStateStream<T> extends StreamAdapter<T> {
  private data = new Map<string, T>()
  private mockSend = jest.fn()

  get = async (groupId: string, id: string): Promise<BaseStreamItem<T> | null> => {
    const data = this.data.get(`${groupId}-${id}`)
    return data ? { id, ...data } as BaseStreamItem<T> : null
  }

  set = async (groupId: string, id: string, data: T): Promise<BaseStreamItem<T>> => {
    this.data.set(`${groupId}-${id}`, data)
    const streamItem = { id, ...data } as BaseStreamItem<T>
    await this.send({ groupId }, { type: 'test_event', data: streamItem })
    return streamItem
  }

  delete = async (groupId: string, id: string): Promise<BaseStreamItem<T> | null> => {
    const data = this.data.get(`${groupId}-${id}`)
    if (data) {
      this.data.delete(`${groupId}-${id}`)
      return { id, ...data } as BaseStreamItem<T>
    }
    return null
  }

  getGroup = async (groupId: string): Promise<BaseStreamItem<T>[]> => {
    const results: BaseStreamItem<T>[] = []
    for (const [key, value] of this.data.entries()) {
      if (key.startsWith(`${groupId}-`)) {
        const id = key.replace(`${groupId}-`, '')
        results.push({ id, ...value } as BaseStreamItem<T>)
      }
    }
    return results
  }

  clear = async (): Promise<void> => {
    this.data.clear()
  }

  send = this.mockSend

  getSendMock() {
    return this.mockSend
  }

  getData() {
    return this.data
  }
}

export class MockObservabilityStream extends StreamAdapter<any> {
  private traces = new Map<string, Trace>()
  private groups = new Map<string, TraceGroup>()
  private mockSend = jest.fn()

  get = async (groupId: string, id: string): Promise<any | null> => {
    if (groupId === 'traces' || groupId === 'default') {
      const trace = this.traces.get(id)
      return trace || null
    }
    if (groupId === 'groups') {
      const group = this.groups.get(id)
      return group || null
    }
    return null
  }

  delete = async (groupId: string, id: string): Promise<any | null> => {
    if (groupId === 'traces' || groupId === 'default') {
      const trace = this.traces.get(id)
      if (trace) {
        this.traces.delete(id)
        return trace
      }
    }
    if (groupId === 'groups') {
      const group = this.groups.get(id)
      if (group) {
        this.groups.delete(id)
        return group
      }
    }
    return null
  }

  getGroup = async (groupId: string): Promise<any[]> => {
    if (groupId === 'traces' || groupId === 'default') {
      return Array.from(this.traces.values())
    }
    if (groupId === 'groups') {
      return Array.from(this.groups.values())
    }
    return []
  }

  set = async (groupId: string, id: string, data: any): Promise<BaseStreamItem<any>> => {
    if (groupId === 'groups') {
      this.groups.set(id, data as TraceGroup)
      const streamItem: BaseStreamItem<any> = { ...data, id }
      await this.send({ groupId: 'observability' }, { type: 'observability_group_event', data: streamItem })
      return streamItem
    }
    
    // Handle traces (both 'traces' and 'default' groupId map to traces)
    this.traces.set(id, data as Trace)
    const streamItem: BaseStreamItem<any> = { ...data, id }
    await this.send({ groupId: 'observability' }, { type: 'observability_event', data: streamItem })
    return streamItem
  }

  send = this.mockSend

  getSendMock() {
    return this.mockSend
  }

  getData() {
    return this.traces
  }

  getGroupData() {
    return this.groups
  }

  clear() {
    this.traces.clear()
    this.groups.clear()
  }
} 