const path = require('path')
const { StateAdapter } = require('./state-adapter')
const { Logger } = require('./logger')

// Add ts-node registration before dynamic imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

function parseArgs(arg) {
  try {
    return JSON.parse(arg)
  } catch {
    return arg
  }
}

async function runTypescriptModule(filePath, args) {
  try {
    const module = require(path.resolve(filePath))

    if (typeof module.executor !== 'function') {
      throw new Error(`Function executor not found in module ${filePath}`)
    } else if (!args?.stateConfig) {
      throw new Error('State adapter config is required')
    }

    const { stateConfig, ...eventData } = args
    const { traceId, flows, type, data } = eventData // Explicitly destructure event properties

    const logger = new Logger(traceId, flows, filePath.split('/').pop())
    const state = new StateAdapter(traceId, stateConfig)
    const context = { traceId, flows, logger, state }

    // Make sure we pass the actual input data to the executor
    await module.executor(
      data,
      async (data) => {
        process.send?.({
          ...data,
          traceId,
          flows,
        })
      },
      context,
    )
  } catch (error) {
    console.error('Error running TypeScript module:', error)
    process.exit(1)
  }
}

const [, , filePath, arg] = process.argv

if (!filePath) {
  console.error('Usage: node nodeRunner.js <file-path> <arg>')
  process.exit(1)
}

runTypescriptModule(filePath, parseArgs(arg)).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
