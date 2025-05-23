import { ZodObject } from 'zod'

export interface StateStreamConfig {
  name: string
  schema: ZodObject<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  baseConfig:
    | { storageType: 'state'; property: string }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | { storageType: 'custom'; factory: () => IStateStream<any> }
}

export type StateStreamEventChannel = { id: string } | { groupId: string }
export type StateStreamEvent<TData> = { type: string; data: TData }

export type BaseStreamItem<TData = unknown> = TData & { id: string }

export type Stream<TConfig extends StateStreamConfig = StateStreamConfig> = {
  filePath: string
  config: TConfig
  hidden?: boolean
}

export interface IStateStream<TData> {
  get(id: string): Promise<BaseStreamItem<TData> | null>
  update(id: string, data: TData): Promise<BaseStreamItem<TData> | null>
  delete(id: string): Promise<BaseStreamItem<TData> | null>
  create(id: string, data: TData): Promise<BaseStreamItem<TData>>
  getGroupId(data: TData): string | null
  getList(groupId: string): Promise<BaseStreamItem<TData>[]>

  send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void>
}
