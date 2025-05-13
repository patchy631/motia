import path from 'path'
import { Logger } from './logger'
import { RpcStateManager } from './rpc-state-manager'
import { RpcSender } from './rpc'
import { composeMiddleware } from './middleware-compose'
import { StreamConfig } from '../types'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config()

// Add ts-node registration before dynamic imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

function parseArgs(arg: string) {
  try {
    return JSON.parse(arg)
  } catch {
    return arg
  }
}

async function runTypescriptModule(filePath: string, event: Record<string, unknown>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require(path.resolve(filePath))

    // Check if the specified function exists in the module
    if (typeof module.handler !== 'function') {
      throw new Error(`Function handler not found in module ${filePath}`)
    }

    const { traceId, flows, contextInFirstArg } = event
    const sender = new RpcSender(process)
    const logger = new Logger(traceId as string, flows as string[], sender)
    const state = new RpcStateManager(sender)

    const emit = async (data: unknown) => sender.send('emit', data)
    const streamConfig = event.streams as StreamConfig[]
    const streams = (streamConfig ?? []).reduce(
      (acc, stream) => {
        acc[stream.name] = {
          get: (id: string) => sender.send(`streams.${stream.name}.get`, { id }),
          update: (id: string, data: any) => sender.send(`streams.${stream.name}.update`, { id, data }),
          delete: (id: string) => sender.send(`streams.${stream.name}.delete`, { id }),
          create: (id: string, data: any) => sender.send(`streams.${stream.name}.create`, { id, data }),
        }
        return acc
      },
      {} as Record<string, any>,
    )

    const context = { traceId, flows, logger, state, emit, streams }

    sender.init()

    const middlewares = Array.isArray(module.config.middleware) ? module.config.middleware : []

    const composedMiddleware = composeMiddleware(...middlewares)
    const handlerFn = () => {
      return contextInFirstArg ? module.handler(context) : module.handler(event.data, context)
    }

    const result = await composedMiddleware(event.data, context, handlerFn)

    await sender.send('result', result)
    await sender.close()

    process.exit(0)
  } catch (error) {
    console.error('Error running TypeScript module:', error)
    process.exit(1)
  }
}

const [, , filePath, arg] = process.argv

if (!filePath) {
  console.error('Usage: node nodeRunner.js <file-path> <arg>')
  process.exit(1)
}

runTypescriptModule(filePath, parseArgs(arg)).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
