import path from 'path'
import fs from 'fs'
import { parse } from 'yaml'
import { createServer } from './server'
import { createFlowHandlers } from './flow-handlers'
import { createEventManager } from './event-manager'
import { Config } from './config.types'
import { buildFlows } from './flow-builder'
import { globalLogger } from './logger'
import { createStateAdapter } from '../state/createStateAdapter'

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

export const dev = async (): Promise<void> => {
  const configYaml = fs.readFileSync(path.join(process.cwd(), 'config.yml'), 'utf8')
  const config: Config = parse(configYaml)
  const steps = await buildFlows()
  const eventManager = createEventManager()
  const state = createStateAdapter(config.state)
  const { server } = await createServer(config, steps, state, eventManager)

  createFlowHandlers(steps, eventManager, config.state)

  console.log('🚀 Server ready and listening on port', config.port)

  // 6) Gracefully shut down on SIGTERM
  process.on('SIGTERM', async () => {
    globalLogger.info('🛑 Shutting down...')
    server.close()
    process.exit(0)
  })
}
