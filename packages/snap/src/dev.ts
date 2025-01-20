import { createServer, createStepHandlers, createEventManager, globalLogger, createStateAdapter } from '@motiadev/core'
import { applyMiddleware } from '@motiadev/workbench/middleware'
import { generateLockedData } from './generate-locked-data'
import path from 'path'

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

export const dev = async (port: number): Promise<void> => {
  const lockedData = await generateLockedData(process.cwd())
  const steps = [...lockedData.steps.active, ...lockedData.steps.dev]
  const eventManager = createEventManager()
  const state = createStateAdapter({
    adapter: 'default',
    filePath: path.join(process.cwd(), '.motia'),
  })
  const { app, server } = await createServer({ steps, state, flows: lockedData.flows, eventManager })

  createStepHandlers(steps, eventManager, state)

  server.listen(port)
  console.log('🚀 Server ready and listening on port', port)
  console.log(`🔗 Open http://localhost:${port}/ to open workbench 🛠️`)

  await applyMiddleware(app)

  // 6) Gracefully shut down on SIGTERM
  process.on('SIGTERM', async () => {
    globalLogger.info('🛑 Shutting down...')
    server.close()
    process.exit(0)
  })
}
