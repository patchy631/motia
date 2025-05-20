import { Logger } from './logger'
import { Log } from './streams/logs-stream'
import { IStateStream } from './types'

type CreateLogger = {
  traceId: string
  flows?: string[]
  stepName: string
}

export class LoggerFactory {
  constructor(
    private readonly isVerbose: boolean,
    private readonly logStream: IStateStream<Log>,
  ) {}

  create({ stepName, traceId, flows }: CreateLogger): Logger {
    return new Logger(traceId, flows, stepName, this.isVerbose, this.logStream)
  }
}
