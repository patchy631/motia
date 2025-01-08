import pino from 'pino'
import { Server } from 'socket.io'

export class Logger {
  private logger: pino.Logger
  private emitLog: (level: string, msg: string, args?: any) => void

  constructor(
    private readonly traceId: string,
    private readonly workflowId: string,
    server: Server,
  ) {
    this.logger = pino({
      level: 'info',
      formatters: { level: (level) => ({ level }) },
      base: null,
      mixin: () => ({ traceId, workflowId }),
    })

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

  log = (message: any) => {
    console.log(JSON.stringify(message))
    this.emitLog(message.level, message.msg, message)
  }

  info = (message: string, args?: any) => {
    this.logger.info(message, args)
    this.emitLog('info', message, args)
  }

  error = (message: string, args?: any) => {
    this.logger.error(message, args)
    this.emitLog('error', message, args)
  }

  debug = (message: string, args?: any) => {
    this.logger.debug(message, args)
    this.emitLog('debug', message, args)
  }

  warn = (message: string, args?: any) => {
    this.logger.warn(message, args)
    this.emitLog('warn', message, args)
  }
}
