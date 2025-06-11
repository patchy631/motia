import { StreamAdapter } from '@motiadev/core/dist/src/streams/adapters/stream-adapter'

export class MockObservabilityStream extends StreamAdapter<any> {
  private traces = new Map<string, any>()
  private groups = new Map<string, any>()
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

  set = async (groupId: string, id: string, data: any): Promise<any> => {
    if (groupId === 'groups') {
      this.groups.set(id, data)
      const streamItem = { ...data, id }
      await this.send({ groupId: 'observability' }, { type: 'observability_group_event', data: streamItem })
      return streamItem
    }
    
    // Handle traces (both 'traces' and 'default' groupId map to traces)
    this.traces.set(id, data)
    const streamItem = { ...data, id }
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