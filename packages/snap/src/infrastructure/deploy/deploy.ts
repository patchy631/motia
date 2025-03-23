import fs from 'fs'
import path from 'path'
import { DeploymentResult } from './types'
import { FileManager } from './file-manager'
import { logger } from './logger'
import { GenericDeploymentError, MissingApiKeyError, MissingStepsConfigError } from './error'
import { DeploymentService } from './services/deployment-service'
import { getSelectedStage } from '../config-utils'

export class DeploymentManager {
  async deploy(
    apiKey: string,
    projectDir: string = process.cwd(),
    version: string = 'latest',
  ): Promise<void> {
    const deploymentService = new DeploymentService(apiKey)

    const stage = getSelectedStage()

    if (!stage) {
      throw new Error('No stage selected')
    }

    if (!apiKey) {
      throw new MissingApiKeyError()
    }

    const distDir = path.join(projectDir, 'dist')
    const stepsConfigPath = path.join(distDir, 'motia.steps.json')

    if (!fs.existsSync(stepsConfigPath)) {
      throw new MissingStepsConfigError()
    }

    const stepsConfig = JSON.parse(fs.readFileSync(stepsConfigPath, 'utf-8'))
    const zipFiles = FileManager.retrieveZipFiles(projectDir, stepsConfig)

    if (zipFiles.length === 0) {
      logger.warning('No zip files found to deploy')
      return
    }

    logger.info(`Found ${zipFiles.length} zip files to deploy`)

    logger.info(`Deploying to environment: ${stage?.name}, version: ${version}`)

    const flowGroups = FileManager.groupStepsByFlow(zipFiles)
    logger.info(`Deploying steps for ${Object.keys(flowGroups).length} flows`)

    const deploymentId = await deploymentService.uploadConfiguration(stepsConfig, stage.id, version)

    const { uploadResults, failedUploads, allSuccessful } = await deploymentService.uploadZipFiles(
      zipFiles,
      deploymentId,
    )

    if (!allSuccessful) {
      throw new GenericDeploymentError(
        new Error(`Deployment aborted due to ${failedUploads.length} upload failures out of ${zipFiles.length} files.`),
        'UPLOAD_FAILURES',
        `Deployment aborted due to ${failedUploads.length} upload failures out of ${zipFiles.length} files.`,
      )
    }

    await deploymentService.startDeployment(deploymentId)

    const deploymentResults: DeploymentResult[] = uploadResults.map((result) => ({
      bundlePath: result.bundlePath,
      deploymentId: result.success ? deploymentId : undefined,
      stepType: result.stepType,
      stepName: result.stepName,
      stepPath: stepsConfig[result.bundlePath]?.entrypointPath,
      flowName: stepsConfig[result.bundlePath]?.config?.flows?.[0] || 'unknown',
      environment: stage.name,
      version: version,
      error: result.error,
      success: result.success,
    }))

    FileManager.writeDeploymentResults(projectDir, deploymentResults, zipFiles, flowGroups, stage.name, version)

    logger.success('Deployment process completed successfully')
  }
}
