import { LockedData, Step, getStepConfig } from '@motiadev/core'
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

      lockedData.createStep({ filePath, version, config }, { disableTypeCreation: true })
    }
  }

  return steps
}

export const generateLockedData = async (projectDir: string): Promise<LockedData> => {
  try {
    /*
     * NOTE: right now for performance and simplicity let's enforce a folder,
     * but we might want to remove this and scan the entire current directory
     */
    const lockedData = new LockedData(projectDir)

    await collectFlows(path.join(projectDir, 'steps'), lockedData)
    lockedData.saveTypes()

    return lockedData
  } catch (error) {
    console.error(error)
    throw Error('Failed to parse the project, generating locked data step failed')
  }
}
