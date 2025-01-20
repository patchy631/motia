#!/usr/bin/env node
import { program } from 'commander'
import path from 'path'

const defaultPort = 3000

require('dotenv/config')
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

program
  .command('dev')
  .description('Start the development server')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-d, --debug', 'Enable debug logging')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const port = arg.port ? parseInt(arg.port) : defaultPort
    const { dev } = require('./dev')
    await dev(port)
  })

program
  .command('get-config')
  .description('Get the generated config for your project')
  .option('-o, --output <port>', 'Path to write the generated config')
  .action(async (arg) => {
    const { generateLockedData } = require('./src/generate/locked-data')
    const lockedData = await generateLockedData(path.join(process.cwd()))

    if (arg.output) {
      const fs = require('fs')
      fs.writeFileSync(path.join(arg.output, '.motia.generated.json'), JSON.stringify(lockedData, null, 2))
      console.log(`📄 Wrote locked data to ${arg.output}`)

      return
    }
    console.log(JSON.stringify(lockedData, null, 2))
  })

program.parse(process.argv)
