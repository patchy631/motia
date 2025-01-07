const pino = require('pino')

class Logger {
  constructor(traceId, workflowId, file) {
    this.logger = pino({
      level: 'info',
      formatters: { level: (level) => ({ level }) },
      errorKey: 'error',
      base: null,
      mixin: () => ({ traceId, workflowId, file }),
    })
  }

  info = (message, args) => this.logger.info(message, args)
  error = (message, args) => this.logger.error(message, args)
  debug = (message, args) => this.logger.debug(message, args)
  warn = (message, args) => this.logger.warn(message, args)
}

module.exports = { Logger }
