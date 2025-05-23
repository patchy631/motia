import { StateStream } from '../state-stream'

export type Log = {
  id: string
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

/*
 * We're not storing logs in the state because of size of data
 * if process stays for to long it would consume too much memory
 * in this case, we're just streaming through events.
 */
export class LogsStream extends StateStream<Log> {
  get = async () => null
  update = async () => null
  delete = async () => null
  getList = async () => []
  getGroupId = () => null

  async create(_: string, data: Log): Promise<Log> {
    await this.send({ groupId: 'default' }, { type: 'log', data })
    return data
  }
}
