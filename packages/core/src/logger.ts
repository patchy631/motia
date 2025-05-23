import { randomUUID } from 'crypto'
import { prettyPrint } from './pretty-print'
import { Log } from './streams/logs-stream'
import { StateStream } from './state-stream'

const logLevel = process.env.LOG_LEVEL ?? 'info'

const isDebugEnabled = logLevel === 'debug'
const isInfoEnabled = ['info', 'debug'].includes(logLevel)
const isWarnEnabled = ['warn', 'info', 'debug', 'trace'].includes(logLevel)

export class BaseLogger {
  constructor(
    readonly isVerbose: boolean = false,
    private readonly meta: Record<string, unknown> = {},
  ) {}

  child(meta: Record<string, unknown> = {}): this {
    return new BaseLogger(this.isVerbose, { ...this.meta, ...meta }) as this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _log(level: string, msg: string, args?: any) {
    const time = Date.now()
    prettyPrint({ level, time, msg, ...this.meta, ...(args ?? {}) }, !this.isVerbose)
  }

  info(message: string, args?: unknown) {
    if (isInfoEnabled) {
      this._log('info', message, args)
    }
  }

  error(message: string, args?: unknown) {
    this._log('error', message, args)
  }

  debug(message: string, args?: unknown) {
    if (isDebugEnabled) {
      this._log('debug', message, args)
    }
  }

  warn(message: string, args?: unknown) {
    if (isWarnEnabled) {
      this._log('warn', message, args)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(args: any) {
    this._log('info', args.msg, args)
  }
}

export class Logger extends BaseLogger {
  private emitLog: (level: string, msg: string, args?: unknown) => void

  constructor(
    private readonly traceId: string,
    private readonly flows: string[] | undefined,
    private readonly step: string,
    isVerbose: boolean,
    private readonly logStream?: StateStream<Log>,
  ) {
    super(isVerbose, { traceId, flows, step })

    this.emitLog = (level: string, msg: string, args?: unknown) => {
      const id = randomUUID()
      this.logStream?.create(id, {
        id,
        step: this.step,
        ...(args ?? {}),
        level,
        time: Date.now(),
        msg,
        traceId: this.traceId,
        flows: this.flows ?? [],
      })
    }
  }

  child(meta: Record<string, unknown> = {}): this {
    return new Logger(this.traceId, this.flows, meta.step as string, this.isVerbose, this.logStream) as this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(message: any) {
    super.log(message)
    this.emitLog(message.level, message.msg, message)
  }

  info = (message: string, args?: unknown) => {
    super.info(message, args)
    this.emitLog('info', message, args)
  }

  error = (message: string, args?: unknown) => {
    super.error(message, args)
    this.emitLog('error', message, args)
  }

  debug = (message: string, args?: unknown) => {
    if (isDebugEnabled) {
      super.debug(message, args)
      this.emitLog('debug', message, args)
    }
  }

  warn = (message: string, args?: unknown) => {
    super.warn(message, args)
    this.emitLog('warn', message, args)
  }
}

export const globalLogger = new BaseLogger()
