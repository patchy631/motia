#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
import { program, Option } from 'commander'
import path from 'path'
import fs from 'fs'

const defaultPort = 3000

require('dotenv/config')
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

program.version(packageJson.version, '-v, --version', 'Output the current version')

program
  .command('version')
  .description('Display detailed version information')
  .action(() => {
    console.log(`Motia CLI v${packageJson.version}`)
  })

program
  .command('create')
  .description('Create a new motia project')
  .option(
    '-n, --name <project name>',
    'The name for your project, used to create a directory, use ./ or . to create it under the existing directory',
  )
  .option('-t, --template <template name>', 'The motia template name to use for your project', 'default')
  .action(async (arg) => {
    const { create } = require('./create')
    await create({
      projectName: arg.name ?? '.',
      template: arg.template ?? 'default',
    })
  })

program
  .command('templates')
  .description('Prints the list of available templates')
  .action(async () => {
    const { templates } = require('./create/templates')
    console.log(`📝 Available templates: \n\n ${Object.keys(templates).join('\n')}`)
  })

program
  .command('dev')
  .description('Start the development server')
  .option('-p, --port <port>', 'The port to run the server on', `${defaultPort}`)
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .action(async (arg) => {
    if (arg.debug) {
      console.log('🔍 Debug logging enabled')
      process.env.LOG_LEVEL = 'debug'
    }

    const port = arg.port ? parseInt(arg.port) : defaultPort
    const { dev } = require('./dev')
    await dev(port, arg.verbose)
  })

program
  .command('build')
  .description('Build the project')
  .action(async () => {
    const { build } = require('./builder/build')
    await build()
  })

program
  .command('deploy')
  .description('Deploy the project to the Motia deployment service')
  .requiredOption('-k, --api-key <key>', 'The API key for authentication')
  .addOption(
    new Option('-e, --env <environment>', 'The environment to deploy to')
      .default('dev')
      .choices(['dev', 'staging', 'production']),
  )
  .option('-v, --version <version>', 'The version to deploy', 'latest')
  .action(async (arg) => {
    try {
      const { build } = require('./builder/build')
      await build()

      const { DeploymentManager } = require('./deploy/deploy')
      const deploymentManager = new DeploymentManager()
      await deploymentManager.deploy(arg.apiKey, process.cwd(), arg.env, arg.version)
    } catch (error) {
      console.error('❌ Deployment failed:', error)
      process.exit(1)
    }
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

program
  .command('emit')
  .description('Emit an event to the Motia server')
  .requiredOption('--topic <topic>', 'Event topic/type to emit')
  .requiredOption('--message <message>', 'Event payload as JSON string')
  .option('-p, --port <number>', 'Port number (default: 3000)')
  .action(async (options) => {
    const port = options.port || 3000
    const url = `http://localhost:${port}/emit`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: options.topic,
          data: JSON.parse(options.message),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Event emitted successfully:', result)
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

const generate = program.command('generate').description('Generate motia resources')
generate
  .command('step')
  .description('Create a new step with interactive prompts')
  .option('-d, --dir <step file path>', 'The path relative to the steps directory, used to create the step file')
  .action(async (arg) => {
    const { createStep } = require('./create-step')
    await createStep({
      stepFilePath: arg.dir,
    })
  })

const state = program.command('state').description('Manage application state')

state
  .command('list')
  .description('List the current file state')
  .action(async () => {
    try {
      const statePath = path.join(process.cwd(), '.motia', 'motia.state.json')

      if (!fs.existsSync(statePath)) {
        console.error('Error: State file not found at', statePath)
        process.exit(1)
      }

      const state = require(statePath)
      console.log(JSON.stringify(state, null, 2))
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

const infrastructure = program.command('infrastructure').description('Manage motia infrastructure deployment services')

infrastructure
  .command('init')
  .description('Initialize a new Motia infrastructure deployment project')
  .requiredOption('-k, --api-key <api key>', 'API key for authentication (not stored in config)')
  .option('-n, --name <project name>', 'The name for your infrastructure deployment project')
  .option('-d, --description <description>', 'Description of the infrastructure deployment service')
  .action(async (arg) => {
    try {
      const { initInfrastructure } = require('./infrastructure/init')
      await initInfrastructure({
        name: arg.name,
        description: arg.description,
        apiKey: arg.apiKey
      })
    } catch (error) {
      console.error('❌ Infrastructure initialization failed:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

const project = infrastructure.command('project').description('Manage deployment projects')

project
  .command('list')
  .description('List all projects')
  .option('-k, --api-key <api key>', 'API key for authentication (not stored in config)')
  .option('-u, --api-base-url <url>', 'Base URL for the API (defaults to MOTIA_API_URL env var or https://api.motia.io)')
  .action(async (arg) => {
    try {
      const { listProjects } = require('./infrastructure/project')
      await listProjects({
        apiKey: arg.apiKey,
        apiBaseUrl: arg.apiBaseUrl
      })
    } catch (error) {
      console.error('❌ Failed to list projects:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

project
  .command('id')
  .description('Get the project ID from the current config')
  .action(async () => {
    try {
      const { getProjectId } = require('./infrastructure/project')
      const projectId = getProjectId()
      
      if (projectId) {
        console.log(`Project ID: ${projectId}`)
      } else {
        console.error('❌ No project ID found in motia.config.json')
        console.error('Initialize the project first with motia infrastructure init or check your config file')
        process.exit(1)
      }
    } catch (error) {
      console.error('❌ Failed to get project ID:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

const stage = infrastructure.command('stage').description('Manage deployment stages')

stage
  .command('create')
  .description('Create a new deployment stage')
  .requiredOption('-k, --api-key <api key>', 'API key for authentication (not stored in config)')
  .option('-n, --name <stage name>', 'The name for your deployment stage')
  .option('-d, --description <description>', 'Description of the deployment stage')
  .action(async (arg) => {
    try {
      const { createStage } = require('./infrastructure/stage')
      await createStage({
        name: arg.name,
        description: arg.description,
        apiKey: arg.apiKey,
      })
    } catch (error) {
      console.error('❌ Stage creation failed:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

stage
  .command('select')
  .description('Select a deployment stage')
  .option('-n, --name <stage name>', 'The name of the stage to select')
  .action(async (arg) => {
    try {
      const { selectStage } = require('./infrastructure/stage')
      await selectStage({
        name: arg.name
      })
    } catch (error) {
      console.error('❌ Stage selection failed:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

stage
  .command('list')
  .description('List all deployment stages')
  .requiredOption('-k, --api-key <api key>', 'API key for authentication (when using API)')
  .option('-a, --api', 'Fetch stages from API instead of local config')
  .action(async (arg) => {
    try {
      const { listStages } = require('./infrastructure/stage')
      await listStages({
        useApi: arg.api,
        apiKey: arg.apiKey,
      })
    } catch (error) {
      console.error('❌ Failed to list stages:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

program.parse(process.argv)
