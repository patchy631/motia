import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { logger } from '../logger'

export async function createFolderZip(
  deploymentId: string,
  folderPath: string,
): Promise<{ filePath: string; cleanup: () => void }> {
  const outputPath = path.join(process.cwd(), '.motia', 'deployments')
  fs.mkdirSync(outputPath, { recursive: true })
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(folderPath)) {
      reject(new Error(`Folder not found: ${folderPath}`))
      return
    }

    const distDir = path.dirname(outputPath)
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true })
    }

    const zipFileName = `${deploymentId}.zip`
    const zipFilePath = path.join(outputPath, zipFileName)

    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    output.on('close', () => {
      logger.success(`Created zip archive: ${zipFilePath} (${archive.pointer()} bytes)`)
      resolve({ filePath: zipFilePath, cleanup: () => removeZipFile(zipFilePath) })
    })

    archive.on('error', (err) => {
      reject(err)
    })

    archive.pipe(output)
    archive.directory(folderPath, false)
    archive.finalize()
  })
}

export function removeZipFile(zipFilePath: string): void {
  try {
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath)
      logger.info(`Removed temporary zip file: ${zipFilePath}`)
    }
  } catch (error) {
    logger.warning(
      `Failed to remove temporary zip file ${zipFilePath}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
