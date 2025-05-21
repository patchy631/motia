import { InternalStateManager, IStateStream, BaseStateStreamData } from './types'

export type StateStreamFactory<TData extends BaseStateStreamData> = (state: InternalStateManager) => IStateStream<TData>

export class StateStream<TData extends BaseStateStreamData> implements IStateStream<TData> {
  constructor(
    private readonly state: InternalStateManager,
    private readonly propertyName: string,
  ) {}

  async get(id: string): Promise<TData | null> {
    return this.state.get<TData>(id, this.propertyName)
  }

  async update(id: string, data: TData): Promise<TData> {
    return this.state.set(id, this.propertyName, { ...data, id })
  }

  async delete(id: string): Promise<TData | null> {
    const data = await this.state.delete(id, this.propertyName)
    return data as TData
  }

  async create(id: string, data: TData): Promise<TData> {
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
