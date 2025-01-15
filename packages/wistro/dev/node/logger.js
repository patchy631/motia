const pino = require('pino')

class Logger {
  constructor(traceId, flows, file) {
    this.logger = pino({
      level: 'info',
      formatters: { level: (level) => ({ level }) },
      errorKey: 'error',
      base: null,
      mixin: () => ({ traceId, flows, file }),
    })
  }

  info = (message, args) => this.logger.info(args, message)
  error = (message, args) => this.logger.error(args, message)
  debug = (message, args) => this.logger.debug(args, message)
  warn = (message, args) => this.logger.warn(args, message)
}

module.exports = { Logger }
