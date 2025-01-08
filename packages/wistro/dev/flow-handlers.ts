import { Event, EventManager } from './../wistro.types'
import { spawn } from 'child_process'
import path from 'path'
import { FlowStep } from './config.types'
import { AdapterConfig } from '../state/createStateAdapter'
import { Server } from 'socket.io'

const nodeRunner = path.join(__dirname, 'node', 'node-runner.js')
const pythonRunner = path.join(__dirname, 'python', 'python-runner.py')

const callFlowFile = <TData>(
  flowPath: string,
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
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    })

    child.on('message', (message: Event<unknown>) => {
      console.log(`[${command} Runner] Received message`, message)
      eventManager.emit({ ...message, traceId: event.traceId })
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

export const createFlowHandlers = (
  flows: FlowStep[],
  eventManager: EventManager,
  stateConfig: AdapterConfig,
  socketServer?: Server,
) => {
  console.log(`[Flows] Creating flow handlers for ${flows.length} flows`)

  flows.forEach((flow) => {
    const { config, file, filePath } = flow
    const { subscribes } = config

    console.log(`[Flows] Establishing flow subscriptions ${file} for flows: ${config.flows.join(', ')}`)

    subscribes.forEach((subscribe) => {
      eventManager.subscribe(subscribe, file, async (event) => {
        console.log(`[Flow] ${file} received event`, event)
        socketServer?.emit('event', { time: Date.now(), event, file, traceId: event.traceId })

        try {
          await callFlowFile(filePath, event, stateConfig, eventManager)
        } catch (error) {
          console.error(`[Flow] ${file} error calling flow`, { error, filePath })
        }
      })
    })
  })
}
