import pino from 'pino'

export class Logger {
  private logger: pino.Logger

  constructor(traceId: string, flows: string[], file?: string) {
    this.logger = pino({
      level: 'info',
      formatters: { level: (level) => ({ level }) },
      errorKey: 'error',
      base: null,
      mixin: () => ({ traceId, flows, file }),
    })
  }

  info = (message: string, args: Record<string, unknown>) => this.logger.info(args, message)
  error = (message: string, args: Record<string, unknown>) => this.logger.error(args, message)
  debug = (message: string, args: Record<string, unknown>) => this.logger.debug(args, message)
  warn = (message: string, args: Record<string, unknown>) => this.logger.warn(args, message)
}
