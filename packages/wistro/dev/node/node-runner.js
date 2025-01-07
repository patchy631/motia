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
    // Remove pathToFileURL since we'll use require
    const module = require(path.resolve(filePath))

    // Check if the specified function exists in the module
    if (typeof module.executor !== 'function') {
      throw new Error(`Function executor not found in module ${filePath}`)
    } else if (!args?.stateConfig) {
      throw new Error('State adapter config is required')
    }

    const { stateConfig, ...event } = args
    const { traceId, workflowId } = event
    const logger = new Logger(traceId, workflowId, filePath.split('/').pop())
    const state = new StateAdapter(traceId, stateConfig)
    const context = { traceId, workflowId, logger, state }
    const emit = async (data) => {
      process.send?.(data)
    }

    // Call the function with provided arguments
    await module.executor(event.data, emit, context)
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
