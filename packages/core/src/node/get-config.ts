import path from 'path'
import { ZodObject } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'

// Add ts-node registration before dynamic imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

async function getConfig(filePath: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require(path.resolve(filePath))

    // Check if the specified function exists in the module
    if (!module.config) {
      throw new Error(`Config not found in module ${filePath}`)
    }

    if (module.config.input instanceof ZodObject) {
      module.config.input = zodToJsonSchema(module.config.input)
    } else if (module.config.bodySchema instanceof ZodObject) {
      module.config.bodySchema = zodToJsonSchema(module.config.bodySchema)
    }

    if (module.config.responseSchema) {
      for (const [status, schema] of Object.entries(module.config.responseSchema)) {
        if (schema instanceof ZodObject) {
          module.config.responseSchema[status] = zodToJsonSchema(schema)
        }
      }
    }

    process.send?.(module.config)

    process.exit(0)
  } catch (error) {
    console.error('Error running TypeScript module:', error)
    process.exit(1)
  }
}

const [, , filePath] = process.argv

if (!filePath) {
  console.error('Usage: node get-config.js <file-path>')
  process.exit(1)
}

getConfig(filePath).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
