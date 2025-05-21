import { LockedData } from '../locked-data'
import { IStateStream } from '../types'

export type Flow = {
  id: string
  name: string
}

export class FlowsStream implements IStateStream<Flow> {
  constructor(private readonly lockedData: LockedData) {}

  async get(id: string): Promise<Flow | null> {
    return (
      Object.entries(this.lockedData.flows)
        .map(([id, flow]) => ({ id, name: flow.name }))
        .find((flow) => flow.id === id) ?? null
    )
  }

  async update(id: string, data: Flow): Promise<Flow | null> {
    return data
  }

  async delete(id: string): Promise<Flow | null> {
    return { id, name: id }
  }

  async create(_: string, data: Flow): Promise<Flow> {
    return data
  }

  async getList(): Promise<Flow[]> {
    return Object.entries(this.lockedData.flows).map(([id, flow]) => ({ id, name: flow.name }))
  }

  getGroupId(): string {
    return 'default'
  }

  async emit() {}
}
