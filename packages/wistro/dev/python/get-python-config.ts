import { spawn } from 'child_process'
import path from 'path'
import { FlowConfig } from '../../wistro.types'
import { globalLogger } from '../logger'

export const getPythonConfig = (file: string): Promise<FlowConfig<any>> => {
  const getConfig = path.join(__dirname, 'get-config.py')

  return new Promise((resolve, reject) => {
    let config: FlowConfig<any> | null = null

    const child = spawn('python', [getConfig, file], {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    })

    child.on('message', (message) => {
      globalLogger.debug('[Python Config] Read config', { config: message })
      config = message as FlowConfig<any>
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`))
      } else if (!config) {
        reject(new Error(`No config found for file ${file}`))
      } else {
        resolve(config)
      }
    })
  })
}
