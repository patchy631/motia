import { logger } from './logger'
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
}

export const fileManager = FileManager.getInstance()
