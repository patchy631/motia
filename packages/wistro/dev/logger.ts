import pino from 'pino'

export class Logger {
  private logger: pino.Logger

  constructor(traceId: string, workflowId: string) {
    this.logger = pino({
      level: 'info',
      formatters: { level: (level) => ({ level }) },
      base: null,
      mixin: () => ({ traceId, workflowId }),
    })
  }

  info = (message: string, args?: any) => this.logger.info(message, args)
  error = (message: string, args?: any) => this.logger.error(message, args)
  debug = (message: string, args?: any) => this.logger.debug(message, args)
  warn = (message: string, args?: any) => this.logger.warn(message, args)
}
