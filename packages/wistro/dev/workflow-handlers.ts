import { spawn } from 'child_process'
import path from 'path'
import { AdapterConfig } from '../state/createStateAdapter'
import { WorkflowStep } from './config.types'
import { Event, EventManager } from './event-manager'

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
        console.log(data)
      }
    })

    child.stderr?.on('data', (data) => console.error(data))

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
  console.log(`[Workflows] Creating workflow handlers for ${workflows.length} workflows`)

  workflows.forEach((workflow) => {
    const { config, file, filePath } = workflow
    const { subscribes } = config

    console.log(`[Workflows] Establishing workflow subscriptions ${file}`)

    subscribes.forEach((subscribe) => {
      eventManager.subscribe(subscribe, file, async (event) => {
        const { logger, ...rest } = event
        logger.info('[Workflow] received event', { event: rest, file })

        try {
          await callWorkflowFile(filePath, file, event, stateConfig, eventManager)
        } catch (error) {
          event.logger.error(`[Workflow] Error calling workflow`, { error, filePath, file })
        }
      })
    })
  })
}
