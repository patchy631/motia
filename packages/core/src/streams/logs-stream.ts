import { IStateStream, StateStreamEvent, StateStreamEventChannel } from '../types'

export type Log = {
  id: string
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class LogsStream implements IStateStream<Log> {
  get = async () => null
  update = async () => null
  delete = async () => null

  async create(_: string, data: Log): Promise<Log> {
    await this.emit({ groupId: 'default' }, { type: 'log', data })
    return data
  }

  async getList(): Promise<Log[]> {
    return []
  }

  getGroupId(data: Log): string {
    return data.traceId
  }

  async emit<T>(_: StateStreamEventChannel, __: StateStreamEvent<T>) {}
}
