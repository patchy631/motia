import { RpcProcessor } from './step-handler-rpc-processor'
import { Event, EventManager, InternalStateManager, Step } from './types'
import { spawn } from 'child_process'
import path from 'path'
import { isAllowedToEmit } from './utils'
import { BaseLogger } from './logger'
import { Printer } from './printer'
import type { Telemetry } from './telemetry/types'

type StateGetInput = { traceId: string; key: string }
type StateSetInput = { traceId: string; key: string; value: unknown }
type StateDeleteInput = { traceId: string; key: string }
type StateClearInput = { traceId: string }

const getLanguageBasedRunner = (
  stepFilePath = '',
): {
  command: string
  runner: string
  args: string[]
} => {
  const isPython = stepFilePath.endsWith('.py')
  const isRuby = stepFilePath.endsWith('.rb')
  const isNode = stepFilePath.endsWith('.js') || stepFilePath.endsWith('.ts')

  if (isPython) {
    const pythonRunner = path.join(__dirname, 'python', 'python-runner.py')
    return { runner: pythonRunner, command: 'python', args: [] }
  } else if (isRuby) {
    const rubyRunner = path.join(__dirname, 'ruby', 'ruby-runner.rb')
    return { runner: rubyRunner, command: 'ruby', args: [] }
  } else if (isNode) {
    if (process.env._MOTIA_TEST_MODE === 'true') {
      const nodeRunner = path.join(__dirname, 'node', 'node-runner.ts')
      return { runner: nodeRunner, command: 'node', args: ['-r', 'ts-node/register'] }
    }

    const nodeRunner = path.join(__dirname, 'node', 'node-runner.js')
    return { runner: nodeRunner, command: 'node', args: [] }
  }

  throw Error(`Unsupported file extension ${stepFilePath}`)
}

type CallStepFileOptions = {
  step: Step
  logger: BaseLogger
  eventManager: EventManager
  state: InternalStateManager
  traceId: string
  printer: Printer
  data?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  contextInFirstArg: boolean // if true, the step file will only receive the context object
  telemetry?: Telemetry
}

export const callStepFile = <TData>(options: CallStepFileOptions): Promise<TData | undefined> => {
  const { step, printer, eventManager, state, traceId, data, contextInFirstArg, telemetry } = options
  const logger = options.logger.child({ step: step.config.name })
  const flows = step.config.flows

  // Record metric for step execution start
  telemetry?.metrics.incrementCounter('steps.execution', 1, {
    step_type: step.config.type,
    step_name: step.config.name,
    flow: flows?.join(',') || '',
  })

  const execStartTime = performance.now()

  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify({ data, flows, traceId, contextInFirstArg })
    const { runner, command, args } = getLanguageBasedRunner(step.filePath)
    let result: TData | undefined

    // Record metric for child process spawn
    telemetry?.metrics.incrementCounter('steps.child_process.spawn', 1, {
      language: command,
      step_name: step.config.name,
    })

    const childStartTime = performance.now()
    const child = spawn(command, [...args, runner, step.filePath, jsonData], {
      stdio: [undefined, undefined, undefined, 'ipc'],
    })

    const rpcProcessor = new RpcProcessor(child)

    rpcProcessor.handler<StateGetInput>('close', async () => child.kill())
    rpcProcessor.handler<StateGetInput>('log', async (input: unknown) => logger.log(input))
    rpcProcessor.handler<StateGetInput>('state.get', (input) => state.get(input.traceId, input.key))
    rpcProcessor.handler<StateSetInput>('state.set', (input) => state.set(input.traceId, input.key, input.value))
    rpcProcessor.handler<StateDeleteInput>('state.delete', (input) => state.delete(input.traceId, input.key))
    rpcProcessor.handler<StateClearInput>('state.clear', (input) => state.clear(input.traceId))
    rpcProcessor.handler<TData>('result', async (input) => {
      result = input
      
      // Record metric for successful step result
      const processingTime = performance.now() - childStartTime
      telemetry?.metrics.recordHistogram('steps.processing.duration_ms', processingTime, {
        step_type: step.config.type,
        step_name: step.config.name,
      })
    })
    rpcProcessor.handler<Event>('emit', async (input) => {
      if (!isAllowedToEmit(step, input.topic)) {
        telemetry?.metrics.incrementCounter('steps.invalid_emit', 1, {
          step_type: step.config.type,
          step_name: step.config.name,
          topic: input.topic,
        })
        return printer.printInvalidEmit(step, input.topic)
      }

      telemetry?.metrics.incrementCounter('steps.emit', 1, {
        step_type: step.config.type,
        step_name: step.config.name,
        topic: input.topic,
      })

      return eventManager.emit({ ...input, traceId, flows: step.config.flows, logger }, step.filePath)
    })

    rpcProcessor.init()

    child.stdout?.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString())
        logger.log(message)
      } catch {
        logger.info(Buffer.from(data).toString())
      }
    })

    child.stderr?.on('data', (data) => {
      // Record metric for stderr output
      telemetry?.metrics.incrementCounter('steps.child_process.stderr', 1, {
        step_name: step.config.name,
      })
      logger.error(Buffer.from(data).toString())
    })

    child.on('close', (code) => {
      const executionTime = performance.now() - execStartTime
      
      if (code !== 0 && code !== null) {
        // Record metric for step execution failure
        telemetry?.metrics.incrementCounter('steps.execution.errors', 1, {
          step_type: step.config.type,
          step_name: step.config.name,
          error_code: `exit_${code}`,
        })
        
        telemetry?.metrics.recordHistogram('steps.execution.duration_ms', executionTime, {
          step_type: step.config.type,
          step_name: step.config.name,
          success: 'false',
        })
        
        reject(`Process exited with code ${code}`)
      } else {
        // Record metric for step execution success
        telemetry?.metrics.recordHistogram('steps.execution.duration_ms', executionTime, {
          step_type: step.config.type,
          step_name: step.config.name,
          success: 'true',
        })
        
        resolve(result)
      }
    })

    child.on('error', (error: { code?: string }) => {
      const executionTime = performance.now() - execStartTime
      
      // Record metric for step execution error
      telemetry?.metrics.incrementCounter('steps.execution.errors', 1, {
        step_type: step.config.type,
        step_name: step.config.name,
        error_type: error.code || 'unknown',
      })
      
      telemetry?.metrics.recordHistogram('steps.execution.duration_ms', executionTime, {
        step_type: step.config.type,
        step_name: step.config.name,
        success: 'false',
      })
      
      if (error.code === 'ENOENT') {
        reject(`Executable ${command} not found`)
      } else {
        reject(error)
      }
    })
  })
}
