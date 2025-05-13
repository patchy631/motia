import { InternalStateManager, ObjectStream } from './types'

export type StreamFactory = (state: InternalStateManager) => ObjectStream<any>

export abstract class StateObjectStream<TData extends object> implements ObjectStream<TData> {
  constructor(
    private readonly state: InternalStateManager,
    private readonly propertyName: string,
  ) {}

  get(id: string): Promise<TData | null> {
    return this.state.get<TData>(id, this.propertyName)
  }

  update(id: string, data: TData): Promise<TData> {
    return this.state.set(id, this.propertyName, data)
  }

  async delete(id: string): Promise<void> {
    await this.state.delete(id, this.propertyName)
  }

  create(id: string, data: TData): Promise<TData> {
    return this.state.set(id, this.propertyName, data)
  }

  abstract getGroupId(data: TData): string | null
  abstract getList(groupId: string): Promise<TData[]>
}

export class UngroupedObjectStream<TData extends object> extends StateObjectStream<TData> {
  getGroupId(): string | null {
    return null
  }

  async getList(): Promise<TData[]> {
    return []
  }
}
