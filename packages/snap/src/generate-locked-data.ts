import { LockedData, Step, getStepConfig, Telemetry } from '@motiadev/core'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

// Helper function to recursively collect flow data
export const collectFlows = async (baseDir: string, lockedData: LockedData): Promise<Step[]> => {
  const folderItems = fs.readdirSync(baseDir, { withFileTypes: true })
  let steps: Step[] = []

  for (const item of folderItems) {
    const filePath = path.join(baseDir, item.name)

    if (item.isDirectory()) {
      steps = steps.concat(await collectFlows(filePath, lockedData))
    } else if (item.name.match(/\.step\.(ts|js|py|rb)$/)) {
      const config = await getStepConfig(filePath)

      if (!config) {
        console.warn(`No config found in step ${filePath}, step skipped`)
        continue
      }

      lockedData.createStep({ filePath, version, config })
    }
  }

  return steps
}

/**
 * Generates locked data by scanning the project directory for steps
 * @param projectDir Directory of the Motia project
 * @param telemetry Optional telemetry instance to track steps and flows
 * @returns LockedData instance with loaded steps and flows
 */
export const generateLockedData = async (projectDir: string, telemetry?: Telemetry): Promise<LockedData> => {
  try {
    /*
     * NOTE: right now for performance and simplicity let's enforce a folder,
     * but we might want to remove this and scan the entire current directory
     */
    const lockedData = new LockedData(projectDir, telemetry)

    await collectFlows(path.join(projectDir, 'steps'), lockedData)

    return lockedData
  } catch (error) {
    if (telemetry) {
      telemetry.metrics.incrementCounter('project.initialization.error', 1)
      if (error instanceof Error) {
        telemetry.tracer.recordException(error)
      }
    }
    
    console.error(error)
    throw Error('Failed to parse the project, generating locked data step failed')
  }
}
