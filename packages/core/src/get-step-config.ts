import { spawn } from 'child_process'
import path from 'path'
import { StepConfig } from './types'
import { globalLogger } from './logger'

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
    const pythonRunner = path.join(__dirname, 'python', 'get-config.py')
    return { runner: pythonRunner, command: 'python', args: [] }
  } else if (isRuby) {
    const rubyRunner = path.join(__dirname, 'ruby', 'get-config.rb')
    return { runner: rubyRunner, command: 'ruby', args: [] }
  } else if (isNode) {
    if (process.env._MOTIA_TEST_MODE === 'true') {
      const nodeRunner = path.join(__dirname, 'node', 'get-config.ts')
      return { runner: nodeRunner, command: 'node', args: ['-r', 'ts-node/register'] }
    }

    const nodeRunner = path.join(__dirname, 'node', 'get-config.js')
    return { runner: nodeRunner, command: 'node', args: [] }
  }

  throw Error(`Unsupported file extension ${stepFilePath}`)
}

export const getStepConfig = (file: string): Promise<StepConfig | null> => {
  const { runner, command, args } = getLanguageBasedRunner(file)
  const isWindows = process.platform === 'win32'

  return new Promise((resolve, reject) => {
    let config: StepConfig | null = null

    const child = spawn(command, [...args, runner, file], {
      stdio: isWindows 
        ? ['inherit', 'pipe', 'inherit', 'ipc']  // On Windows, capture stdout
        : ['inherit', 'inherit', 'inherit', 'ipc']  // Original config for Unix
    })

    // On Windows, we need to listen for stdout data
    if (isWindows) {
      child.stdout?.on('data', (data) => {
        const message = JSON.parse(data.toString());
        globalLogger.debug('[Config] Read config', { config: message });
        config = message;
        resolve(config);
        child.kill();
      });
    }

    // Original IPC message handler
    child.on('message', (message: StepConfig) => {
      globalLogger.debug('[Config] Read config', { config: message })
      config = message
      resolve(config)
      child.kill() // we can kill the child process since we already received the message
    })

    child.on('close', (code) => {
      if (config) {
        return // Config was already resolved
      } else if (code !== 0) {
        reject(`Process exited with code ${code}`)
      } else if (!config) {
        reject(`No config found for file ${file}`)
      }
    })

    child.on('error', (error: { code?: string }) => {
      if (error.code === 'ENOENT') {
        reject(`Executable ${command} not found`)
      } else {
        reject(error)
      }
    })
  })
}
