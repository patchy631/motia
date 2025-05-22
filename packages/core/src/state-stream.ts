import { BaseStreamItem, InternalStateManager, IStateStream } from './types'

export type StateStreamFactory<TData> = (state: InternalStateManager) => IStateStream<TData>

export class StateStream<TData> implements IStateStream<TData> {
  constructor(
    private readonly state: InternalStateManager,
    private readonly propertyName: string,
  ) {}

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
