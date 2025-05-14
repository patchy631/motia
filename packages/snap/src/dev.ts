// packages/snap/src/dev.ts
import {
  createServer,
  createStepHandlers,
  createEventManager,
  globalLogger,
  createStateAdapter,
  createMermaidGenerator,
} from '@motiadev/core'
import { generateLockedData } from './generate-locked-data'
import path from 'path'
import { FileStateAdapter } from '@motiadev/core/dist/src/state/adapters/default-state-adapter'
import { createDevWatchers } from './dev-watchers'
import { stateEndpoints } from './dev/state-endpoints'
import { activatePythonVenv } from './utils/activatePythonEnv'
import { initializeSnapTelemetry, getTelemetryConfigFromEnv } from './utils/telemetry-init'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

export const dev = async (port: number, isVerbose: boolean, enableMermaid: boolean): Promise<void> => {
  const baseDir = process.cwd()
  
  // Configure telemetry with anonymized project and user attributes
  const telemetryConfig = {
    ...getTelemetryConfigFromEnv(),
    debug: isVerbose,
  }
  
  const telemetry = initializeSnapTelemetry(telemetryConfig)

  activatePythonVenv({ baseDir, isVerbose })

  const lockedData = await generateLockedData(baseDir, telemetry)
  const eventManager = createEventManager(telemetry)
  const state = createStateAdapter({
    adapter: 'default',
    filePath: path.join(baseDir, '.motia'),
  })
  await (state as FileStateAdapter).init()

  const config = { 
    isVerbose,
    telemetry: {
      enabled: telemetryConfig.enabled,
      environment: telemetryConfig.environment,
      endpoint: telemetryConfig.endpoint,
      debug: telemetryConfig.debug,
      customAttributes: telemetryConfig.attributes,
    } 
  }
  
  const motiaServer = await createServer(lockedData, eventManager, state, config)
  const motiaEventManager = createStepHandlers(lockedData, eventManager, state)
  const watcher = createDevWatchers(lockedData, motiaServer, motiaEventManager, motiaServer.cronManager)

  // Initialize mermaid generator
  if (enableMermaid) {
    const mermaidGenerator = createMermaidGenerator(baseDir)
    mermaidGenerator.initialize(lockedData)
  }

  watcher.init()

  stateEndpoints(motiaServer, state)
  motiaServer.server.listen(port)
  console.log('🚀 Server ready and listening on port', port)
  console.log(`🔗 Open http://localhost:${port}/ to open workbench 🛠️`)

  const { applyMiddleware } = process.env.__MOTIA_DEV_MODE__
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@motiadev/workbench/middleware')
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@motiadev/workbench/dist/middleware')
  await applyMiddleware(motiaServer.app)

  // 6) Gracefully shut down on SIGTERM
  process.on('SIGTERM', async () => {
    globalLogger.info('🛑 Shutting down...')
    motiaServer.server.close()
    await watcher.stop()
    
    // Shut down telemetry
    if (telemetry) {
      await telemetry.shutdown()
    }
    
    process.exit(0)
  })
}
