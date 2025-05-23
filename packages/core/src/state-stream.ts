import type { InternalStateManager } from './types'
import type { BaseStreamItem, IStateStream, StateStreamEvent, StateStreamEventChannel } from './types-stream'

export type StateStreamFactory<TData> = () => IStateStream<TData>

export abstract class StateStream<TData> implements IStateStream<TData> {
  abstract get(id: string): Promise<BaseStreamItem<TData> | null>
  abstract update(id: string, data: TData): Promise<BaseStreamItem<TData> | null>
  abstract delete(id: string): Promise<BaseStreamItem<TData> | null>
  abstract create(id: string, data: TData): Promise<BaseStreamItem<TData>>
  abstract getGroupId(data: TData): string | null
  abstract getList(groupId: string): Promise<BaseStreamItem<TData>[]>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void> {}
}

export class InternalStateStream<TData> extends StateStream<TData> {
  constructor(
    private readonly state: InternalStateManager,
    private readonly propertyName: string,
  ) {
    super()
  }

  async get(id: string): Promise<BaseStreamItem<TData> | null> {
    return this.state.get<BaseStreamItem<TData>>(id, this.propertyName)
  }

  async update(id: string, data: TData): Promise<BaseStreamItem<TData> | null> {
    return this.state.set(id, this.propertyName, { ...data, id })
  }

  async delete(id: string): Promise<BaseStreamItem<TData> | null> {
    const data = await this.state.delete(id, this.propertyName)
    return data as BaseStreamItem<TData> | null
  }

  async create(id: string, data: TData): Promise<BaseStreamItem<TData>> {
    return this.state.set(id, this.propertyName, { ...data, id })
  }

  getGroupId() {
    return null
  }

  async getList() {
    return []
  }

  async send() {}
}
