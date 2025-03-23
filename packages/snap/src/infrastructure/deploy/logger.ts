import colors from 'colors'

export class Logger {
  info(message: string): void {
    console.log(colors.blue('ℹ [INFO] '), message)
  }

  success(message: string): void {
    console.log(colors.green('✓ [SUCCESS] '), message)
  }

  warning(message: string): void {
    console.log(colors.yellow('⚠ [WARNING] '), message)
  }

  error(message: string): void {
    console.error(colors.red('✗ [ERROR] '), message)
  }
}

export const logger = new Logger()
