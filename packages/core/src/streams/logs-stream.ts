import { IStateStream } from '../types'

export type Log = {
  id: string
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export class LogsStream implements IStateStream<Log> {
  private logs: Log[] = []

  async get(id: string): Promise<Log | null> {
    const log = this.logs.find((log) => log.id === id)
    return log ?? null
  }

  async update(id: string, data: Log): Promise<Log | null> {
    const index = this.logs.findIndex((log) => log.id === id)

    if (index === -1) {
      return null
    }

    const log = this.logs[index]
    this.logs[index] = { ...log, ...data }

    return log
  }

  async delete(id: string): Promise<Log | null> {
    const index = this.logs.findIndex((log) => log.id === id)

    if (index === -1) {
      return null
    }

    const log = this.logs[index]
    this.logs.splice(index, 1)

    return log
  }

  async create(_: string, data: Log): Promise<Log> {
    this.logs.push(data)
    return data
  }

  async getList(groupId: string): Promise<Log[]> {
    if (groupId === 'default') {
      return this.logs
    }

    return this.logs.filter((log) => log.traceId === groupId)
  }

  getGroupId(data: Log): string {
    return data.traceId
  }
}
