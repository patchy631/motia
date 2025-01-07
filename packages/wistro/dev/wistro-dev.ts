import path from 'path'
import fs from 'fs'
import { parse } from 'yaml'
import { createServer } from './server'
import { createWorkflowHandlers } from './workflow-handlers'
import { getPythonConfig } from './python/get-python-config'
import { createEventManager } from './event-manager'
import { Config, WorkflowStep } from './config.types'
import { FlowConfig } from '../wistro.types'

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

async function parseWorkflowFolder(folderPath: string, nextWorkflows: WorkflowStep[]): Promise<WorkflowStep[]> {
  const workflowFolderItems = fs.readdirSync(folderPath, { withFileTypes: true })
  const workflowFiles = workflowFolderItems
    .filter(({ name }) => name.endsWith('.ts') || name.endsWith('.js') || name.endsWith('.py'))
    .map(({ name }) => name)
  const workflowRootFolders = workflowFolderItems.filter((item) => item.isDirectory())
  let workflows: WorkflowStep[] = [...nextWorkflows]

  console.log('[Workflows] Building workflows', workflowFiles)

  for (const file of workflowFiles) {
    const isPython = file.endsWith('.py')

    if (isPython) {
      console.log('[Workflows] Building Python workflow', file)
      const config = await getPythonConfig(path.join(folderPath, file)).catch((error: unknown) => {
        console.log(`[Workflows] skipping file ${file} as it does not have a valid config`, { error })
        return null
      })
      if (!config) {
        continue
      }
      console.log('[Workflows] Python workflow config', config)
      workflows.push({ config, file, filePath: path.join(folderPath, file) })
    } else {
      console.log('[Workflows] Building Node workflow', file)
      const module = require(path.join(folderPath, file))
      if (!module.config) {
        console.log(`[Workflows] skipping file ${file} as it does not have a valid config`)
        continue
      }
      console.log(
        `[Workflows] processing component ${module.config.name} for workflow ${module.config.tags?.workflow ?? file}`,
      )
      const config = module.config as FlowConfig<any>
      workflows.push({ config, file, filePath: path.join(folderPath, file) })
    }
  }

  if (workflowRootFolders.length > 0) {
    for (const folder of workflowRootFolders) {
      console.log('[Workflows] Building nested workflows in path', path.join(folderPath, folder.name))
      const nestedWorkflows = await parseWorkflowFolder(path.join(folderPath, folder.name), [])
      workflows = [...workflows, ...nestedWorkflows]
    }
  }

  return workflows
}

async function buildWorkflows(): Promise<WorkflowStep[]> {
  // Read all workflow folders under /flows directory
  const flowsDir = path.join(process.cwd(), 'steps')

  // Check if steps directory exists
  if (!fs.existsSync(flowsDir)) {
    console.log('No /steps directory found')
    return []
  }

  // Get all workflow folders
  return parseWorkflowFolder(flowsDir, [])
}

export const dev = async (): Promise<void> => {
  const configYaml = fs.readFileSync(path.join(process.cwd(), 'config.yml'), 'utf8')
  const config: Config = parse(configYaml)
  const workflowSteps = await buildWorkflows()
  const eventManager = createEventManager()
  const server = createServer(config, workflowSteps, eventManager)

  createWorkflowHandlers(workflowSteps, eventManager, config.state)

  // 6) Gracefully shut down on SIGTERM
  process.on('SIGTERM', async () => {
    console.log('[playground/index] Shutting down...')
    server.close()
    process.exit(0)
  })
}
