#!/usr/bin/env node
const { program } = require('commander')

require('dotenv/config')
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

program //
  .command('dev')
  .description('Start the development server')
  .option('-d, --debug', 'Enable debug logging')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const { dev } = require('./dev/wistro-dev')
    await dev()
  })

program.parse(process.argv)
