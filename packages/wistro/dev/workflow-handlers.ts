import { spawn } from 'child_process'
import path from 'path'
import { AdapterConfig } from '../state/createStateAdapter'
import { WorkflowStep } from './config.types'
import { Event, EventManager } from './event-manager'
import { globalLogger } from './logger'

const nodeRunner = path.join(__dirname, 'node', 'node-runner.js')
const pythonRunner = path.join(__dirname, 'python', 'python-runner.py')

const callWorkflowFile = <TData>(
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
      eventManager.emit(
        { ...message, traceId: event.traceId, workflowId: event.workflowId, logger: event.logger },
        file,
      )
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

export const createWorkflowHandlers = (
  workflows: WorkflowStep[],
  eventManager: EventManager,
  stateConfig: AdapterConfig,
) => {
  globalLogger.debug(`[Workflows] Creating workflow handlers for ${workflows.length} workflows`)

  workflows.forEach((workflow) => {
    const { config, file, filePath } = workflow
    const { subscribes } = config

    globalLogger.debug(`[Workflows] Establishing workflow subscriptions`, { file })

    subscribes.forEach((subscribe) => {
      eventManager.subscribe(subscribe, file, async (event) => {
        const { logger, ...rest } = event
        globalLogger.debug('[Workflow] received event', { event: rest, file })

        try {
          await callWorkflowFile(filePath, file, event, stateConfig, eventManager)
        } catch (error: any) {
          globalLogger.error(`[Workflow] Error calling workflow`, { error: error.message, filePath, file })
        }
      })
    })
  })
}
