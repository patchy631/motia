import { Logger } from './logger'
import { StateStream } from './state-stream'
import { Log } from './streams/logs-stream'

type CreateLogger = {
  traceId: string
  flows?: string[]
  stepName: string
}

export class LoggerFactory {
  constructor(
    private readonly isVerbose: boolean,
    private readonly logStream: StateStream<Log>,
  ) {}

  create({ stepName, traceId, flows }: CreateLogger): Logger {
    return new Logger(traceId, flows, stepName, this.isVerbose, this.logStream)
  }
}
