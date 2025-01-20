import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import { LockedData, Step, getNodeFileConfig, getPythonConfig, getRubyConfig } from '@motiadev/core'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`
const baseFlowRegex = new RegExp(/flows\"?\s?.*\s*\[([^\]]+)\]/)

// Helper function to read config.yml
const readConfig = (configPath: string): any => {
  if (!fs.existsSync(configPath)) {
    console.warn(`Config file not found at ${configPath}`)

    return {};
  }
  const configContent = fs.readFileSync(configPath, 'utf-8')
  return yaml.parse(configContent)
}

const extractStepConfig = (filePath: string) => {
  const isRb = filePath.endsWith('.rb')
  const isPython = filePath.endsWith('.py')
  const isNode = filePath.endsWith('.js') || filePath.endsWith('.ts')

  if (isRb) {
    return getRubyConfig(filePath)
  }

  if (isPython) {
    return getPythonConfig(filePath)
  }

  if (isNode) {
    return getNodeFileConfig(filePath)
  }
}

// Helper function to recursively collect flow data
const collectFlows = async (baseDir: string): Promise<Step[]> => {
  const folderItems = fs.readdirSync(baseDir, { withFileTypes: true })
  let steps: Step[] = []

  for (const item of folderItems) {
    const itemPath = path.join(baseDir, item.name)

    if (item.isDirectory()) {
      steps = steps.concat(await collectFlows(itemPath))
    } else if (!!item.name.match(/\.step\.(ts|js|py|rb)$/)) {
      const fileContent = fs.readFileSync(itemPath, 'utf-8')
      const flowMatch = fileContent.match(baseFlowRegex)

      const config = await extractStepConfig(itemPath)

      if (!config) {
        console.warn(`No config found in step ${itemPath}, step skipped`)
        continue
      }

      if (flowMatch) {
        steps.push({
          // TODO: when the lock file comes back, this needs to be updated to use a relative path
          filePath: itemPath,
          version,
          config,
        })
      }
    }
  }

  return steps
}

export const generateLockedData = async (projectDir: string): Promise<LockedData> => {
  const configPath = path.join(projectDir, 'config.yml')
  // NOTE: right now for performance and simplicity let's enforce a folder, but we might want to remove this and scan the entire current directory
  const stepsPath = path.join(projectDir, 'steps')

  try {
    const config = readConfig(configPath)

    // Collect steps data from steps folder
    const sourceSteps = await collectFlows(stepsPath)

    const { flows, steps } = sourceSteps.reduce(
      (acc, step) => {
        const nextSteps = { ...acc.steps }

        // NOTE: identifies a noop step
        if (step.config.virtualEmits) {
          nextSteps.dev.push(step)
        } else {
          nextSteps.active.push(step)
        }

        const nextFlows = { ...acc.flows }

        step.config.flows.forEach((flowName) => {
          if (!nextFlows[flowName]) {
            nextFlows[flowName] = {
              name: flowName,
              // TODO: how are we going to extract descriptions?
              description: '',
              steps: [],
            }
          }

          nextFlows[flowName].steps.push(step)
        })

        return {
          ...acc,
          steps: nextSteps,
          flows: nextFlows,
        }
      },
      {
        flows: {},
        steps: {
          active: [],
          dev: [],
        },
      } as Pick<LockedData, 'flows' | 'steps'>,
    )

    // Prepare the lock file data
    const lockedData: LockedData = {
      baseDir: projectDir,
      state: config?.state || {},
      steps,
      flows,
    }

    console.log('Project config loaded')

    // TODO: for now this will return the locked data as an object, in the future we will write it to a lock file
    return lockedData
  } catch (error) {
    console.error('Error generating locked data:', error)
    throw Error('Failed to parse the project, generating locked data step failed')
  }
}
