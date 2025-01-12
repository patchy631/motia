import pino from 'pino'
import { Server } from 'socket.io'

const isDebugEnabled = () => process.env.LOG_LEVEL === 'debug'

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
    private readonly flows: string[],
    private readonly file: string,
    socketServer?: Server,
  ) {
    super({ traceId, flows, file })

    this.emitLog = (level: string, msg: string, args?: any) => {
      if (!socketServer) {
        return
      }

      socketServer.emit('log', {
        file: this.file,
        ...(args ?? {}),
        level,
        time: Date.now(),
        msg,
        traceId: this.traceId,
        flows: this.flows,
      })
    }
  }

  log(message: any) {
    console.log(JSON.stringify(message))
    this.emitLog(message.level, message.msg, message)
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
    if (isDebugEnabled()) {
      this.emitLog('debug', message, args)
    }
  }

  warn = (message: string, args?: any) => {
    super.warn(message, args)
    this.emitLog('warn', message, args)
  }
}

export const globalLogger = new BaseLogger()
