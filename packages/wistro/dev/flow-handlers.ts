import { Event, EventManager } from './../wistro.types'
import { spawn } from 'child_process'
import path from 'path'
import { Step } from './config.types'
import { AdapterConfig } from '../state/createStateAdapter'
import { globalLogger } from './logger'
import { isEventStep } from './guards'

const nodeRunner = path.join(__dirname, 'node', 'node-runner.js')
const pythonRunner = path.join(__dirname, 'python', 'python-runner.py')

const callFlowFile = <TData>(
  flowPath: string,
  file: string,
  event: Event<TData>,
  stateConfig: AdapterConfig,
  eventManager: EventManager,
): Promise<void> => {
  const isPython = flowPath.endsWith('.py')

  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify({ ...event, stateConfig })
    const runner = isPython ? pythonRunner : nodeRunner
    const command = isPython ? 'python' : 'node'

    const child = spawn(command, [runner, flowPath, jsonData], {
      stdio: [undefined, undefined, undefined, 'ipc'],
    })

    child.stdout?.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString())
        event.logger.log(message)
      } catch (error) {
        event.logger.info(Buffer.from(data).toString(), { file })
      }
    })

    child.stderr?.on('data', (data) => event.logger.error(Buffer.from(data).toString(), { file }))

    child.on('message', (message: Event<unknown>) => {
      eventManager.emit({ ...message, traceId: event.traceId, flows: event.flows, logger: event.logger }, file)
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

export const createFlowHandlers = (steps: Step[], eventManager: EventManager, stateConfig: AdapterConfig) => {
  globalLogger.debug(`[Flows] Creating flow handlers for ${steps.length} steps`)

  steps.filter(isEventStep).forEach((step) => {
    const { config, file, filePath } = step
    const { subscribes } = config

    globalLogger.debug('[Flows] Establishing flow subscriptions', { file })

    subscribes.forEach((subscribe) => {
      eventManager.subscribe(subscribe, file, async (event) => {
        const { logger, ...rest } = event
        globalLogger.debug('[Flow] received event', { event: rest, file })

        try {
          await callFlowFile(filePath, file, event, stateConfig, eventManager)
        } catch (error: any) {
          globalLogger.error(`[Flow] Error calling flow`, { error: error.message, filePath, file })
        }
      })
    })
  })
}
