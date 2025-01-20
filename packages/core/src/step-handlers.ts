import { Event, EventManager, InternalStateManager, Step } from './types'
import { spawn } from 'child_process'
import path from 'path'
import { globalLogger } from './logger'
import { isEventStep } from './guards'
import { RpcProcessor } from './step-handler-rpc-processor'

const nodeRunner = path.join(__dirname, 'node', 'node-runner.js')
const pythonRunner = path.join(__dirname, 'python', 'python-runner.py')
const rubyRunner = path.join(__dirname, 'ruby', 'ruby_runner.rb')

const getLanguageBasedRunner = (
  stepFilePath = '',
): {
  command: string
  runner: string
} => {
  const isPython = stepFilePath.endsWith('.py')
  const isRuby = stepFilePath.endsWith('.rb')
  const isNode = stepFilePath.endsWith('.js') || stepFilePath.endsWith('.ts')

  if (isPython) {
    return { runner: pythonRunner, command: 'python' }
  } else if (isRuby) {
    return { runner: rubyRunner, command: 'ruby' }
  } else if (isNode) {
    return { runner: nodeRunner, command: 'node' }
  }

  throw Error(`Unsupported file extension ${stepFilePath}`)
}

type StateGetInput = { traceId: string; key: string }
type StateSetInput = { traceId: string; key: string; value: any }
type StateDeleteInput = { traceId: string; key: string }
type StateClearInput = { traceId: string }

const callStepFile = <TData>(
  stepPath: string,
  step: string,
  event: Event<TData>,
  eventManager: EventManager,
  state: InternalStateManager,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify({ ...event })
    const { runner, command } = getLanguageBasedRunner(stepPath)

    const child = spawn(command, [runner, stepPath, jsonData], {
      stdio: [undefined, undefined, undefined, 'ipc'],
    })

    const rpcProcessor = new RpcProcessor(child)

    rpcProcessor.handler<StateGetInput>('log', async (input: any) => {
      event.logger.log(input)
    })
    rpcProcessor.handler<StateGetInput>('state.get', (input) => state.get(input.traceId, input.key))
    rpcProcessor.handler<StateSetInput>('state.set', (input) => state.set(input.traceId, input.key, input.value))
    rpcProcessor.handler<StateDeleteInput>('state.delete', (input) => state.delete(input.traceId, input.key))
    rpcProcessor.handler<StateClearInput>('state.clear', (input) => state.clear(input.traceId))
    rpcProcessor.handler<Event>('emit', (input) => {
      return eventManager.emit(
        {
          ...input,
          traceId: event.traceId,
          flows: event.flows,
          logger: event.logger,
        },
        stepPath,
      )
    })

    rpcProcessor.init()

    child.stdout?.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString())
        event.logger.log(message)
      } catch (error) {
        event.logger.info(Buffer.from(data).toString(), { step })
      }
    })

    child.stderr?.on('data', (data) => event.logger.error(Buffer.from(data).toString(), { step }))

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

export const createStepHandlers = (steps: Step[], eventManager: EventManager, state: InternalStateManager) => {
  globalLogger.debug(`[step handler] creating step handlers for ${steps.length} steps`)

  steps.filter(isEventStep).forEach((step) => {
    const { config, filePath } = step
    const { subscribes } = config

    globalLogger.debug('[step handler] establishing step subscriptions', { filePath, step: step.config.name })

    subscribes.forEach((subscribe) => {
      eventManager.subscribe(subscribe, step.config.name, async (event) => {
        const { logger, ...rest } = event
        globalLogger.debug('[step handler] received event', { event: rest, step: step.config.name })

        try {
          await callStepFile(filePath, step.config.name, event, eventManager, state)
        } catch (error: any) {
          globalLogger.error(`[step handler] error calling step`, {
            error: error.message,
            filePath,
            step: step.config.name,
          })
        }
      })
    })
  })
}
