import pino from 'pino'
import { Server } from 'socket.io'

class BaseLogger {
  private logger: pino.Logger

  constructor(meta: any = {}) {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: { level: (level) => ({ level }) },
      base: null,
      mixin: () => meta,
    })
  }

  info(message: string, args?: any) {
    this.logger.info(message, args)
  }

  error(message: string, args?: any) {
    this.logger.error(message, args)
  }

  debug(message: string, args?: any) {
    this.logger.debug(message, args)
  }

  warn(message: string, args?: any) {
    this.logger.warn(message, args)
  }
}

export class Logger extends BaseLogger {
  private emitLog: (level: string, msg: string, args?: any) => void

  constructor(
    private readonly traceId: string,
    private readonly workflowId: string,
    server: Server,
  ) {
    super({ traceId, workflowId })

    this.emitLog = (level: string, msg: string, args?: any) => {
      server.emit('log', {
        ...(args ?? {}),
        level,
        time: Date.now(),
        msg,
        traceId: this.traceId,
        workflowId: this.workflowId,
      })
    }
  }

  log(message: any) {
    console.log(JSON.stringify(message))
  }

  info = (message: string, args?: any) => {
    super.info(message, args)
    this.emitLog('info', message, args)
  }

  error = (message: string, args?: any) => {
    super.error(message, args)
    this.emitLog('error', message, args)
  }

  debug = (message: string, args?: any) => {
    super.debug(message, args)
    this.emitLog('debug', message, args)
  }

  warn = (message: string, args?: any) => {
    super.warn(message, args)
    this.emitLog('warn', message, args)
  }
}

export const globalLogger = new BaseLogger()
