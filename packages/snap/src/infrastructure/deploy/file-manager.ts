import fs from 'fs'
import path from 'path'
import { logger } from './logger'
import { DeploymentResult, DeploymentSummary } from './types'
import { createFolderZip } from './utils/archive'

export class FileManager {
  private static instance: FileManager

  private constructor() {}

  public static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager()
    }
    return FileManager.instance
  }

  async createDeployableZip(
    deploymentId: string,
    folderPath: string,
  ): Promise<{ filePath: string; cleanup: () => void }> {
    try {
      const zipFilePath = await createFolderZip(deploymentId, folderPath)
      return zipFilePath
    } catch (error) {
      logger.error(`Failed to create zip for ${folderPath}: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  writeDeploymentResults(
    projectDir: string,
    deploymentResults: DeploymentResult[],
    environment: string,
    version: string,
  ): void {
    const deploymentResultsPath = path.join(projectDir, 'dist', 'motia.deployments.json')
    fs.writeFileSync(deploymentResultsPath, JSON.stringify(deploymentResults, null, 2))

    const summaryPath = path.join(projectDir, 'dist', 'motia.deployments.summary.json')
    const summary: DeploymentSummary = {
      deploymentTime: new Date().toISOString(),
      environment,
      version,
    }

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    logger.info(`Deployment summary written to: ${summaryPath}`)
  }
}

export const fileManager = FileManager.getInstance()
