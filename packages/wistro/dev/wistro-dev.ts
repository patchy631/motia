import path from 'path'
import fs from 'fs'
import { parse } from 'yaml'
import { createServer } from './server'
import { createWorkflowHandlers } from './workflow-handlers'
import { getPythonConfig } from './python/get-python-config'
import { createEventManager } from './event-manager'
import { Config, WorkflowStep } from './config.types'
import { FlowConfig } from '../wistro.types'
import { globalLogger } from './logger'

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

async function parseWorkflowFolder(folderPath: string, nextWorkflows: WorkflowStep[]): Promise<WorkflowStep[]> {
  const workflowFolderItems = fs.readdirSync(folderPath, { withFileTypes: true })
  const workflowFiles = workflowFolderItems
    .filter(({ name }) => name.endsWith('.step.ts') || name.endsWith('.step.js') || name.endsWith('.step.py'))
    .map(({ name }) => name)
  const workflowRootFolders = workflowFolderItems.filter((item) => item.isDirectory())
  let workflows: WorkflowStep[] = [...nextWorkflows]

  globalLogger.debug('[Workflows] Building workflows', { workflowFiles, workflowRootFolders })

  for (const file of workflowFiles) {
    const isPython = file.endsWith('.py')

    if (isPython) {
      globalLogger.debug('[Workflows] Building Python workflow', { file })
      const config = await getPythonConfig(path.join(folderPath, file))
      globalLogger.debug('[Workflows] Python workflow config', { config })
      workflows.push({ config, file, filePath: path.join(folderPath, file) })
    } else {
      globalLogger.debug('[Workflows] Building Node workflow', { file })
      const module = require(path.join(folderPath, file))
      if (!module.config) {
        globalLogger.debug(`[Workflows] skipping file ${file} as it does not have a valid config`)
        continue
      }
      globalLogger.debug('[Workflows] processing component', { config: module.config })
      const config = module.config as FlowConfig<any>
      workflows.push({ config, file, filePath: path.join(folderPath, file) })
    }
  }

  if (workflowRootFolders.length > 0) {
    for (const folder of workflowRootFolders) {
      globalLogger.debug('[Workflows] Building nested workflows in path', { path: path.join(folderPath, folder.name) })
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
    globalLogger.error('No /steps directory found')
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
  const { server } = await createServer(config, workflowSteps, eventManager)

  createWorkflowHandlers(workflowSteps, eventManager, config.state)

  console.log('🚀 Server ready and listening on port', config.port)

  // 6) Gracefully shut down on SIGTERM
  process.on('SIGTERM', async () => {
    globalLogger.info('[playground/index] Shutting down...')
    server.close()
    process.exit(0)
  })
}
