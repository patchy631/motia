import fs from 'fs'
import path from 'path'
import { DeploymentResult, DeploymentConfig } from './types'
import { FileManager } from './file-manager'
import { logger } from './logger'
import { GenericDeploymentError, MissingApiKeyError, MissingStepsConfigError } from './error'
import { deploymentService } from './services/deployment-service'

export class DeploymentManager {
  async deploy(
    apiKey: string,
    projectDir: string = process.cwd(),
    environment: string = 'dev',
    version: string = 'latest',
  ): Promise<void> {
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

    const deploymentConfig: DeploymentConfig = {
      apiKey,
      environment,
      version,
    }

    logger.info(`Deploying to environment: ${environment}, version: ${version}`)

    const flowGroups = FileManager.groupStepsByFlow(zipFiles)
    logger.info(`Deploying steps for ${Object.keys(flowGroups).length} flows`)

    // First, upload the steps configuration to get a deploymentId
    const deploymentId = await deploymentService.uploadConfiguration(stepsConfig, apiKey, environment, version)

    // Then upload all zip files with the deploymentId
    const { uploadResults, failedUploads, allSuccessful } = await deploymentService.uploadZipFiles(
      zipFiles,
      apiKey,
      environment,
      version,
      deploymentId,
    )

    if (!allSuccessful) {
      throw new GenericDeploymentError(
        new Error(`Deployment aborted due to ${failedUploads.length} upload failures out of ${zipFiles.length} files.`),
        'UPLOAD_FAILURES',
        `Deployment aborted due to ${failedUploads.length} upload failures out of ${zipFiles.length} files.`,
      )
    }

    // Finally, start the deployment
    await deploymentService.startDeployment(deploymentId, deploymentConfig)

    const deploymentResults: DeploymentResult[] = uploadResults.map((result) => ({
      bundlePath: result.bundlePath,
      deploymentId: result.success ? deploymentId : undefined,
      stepType: result.stepType,
      stepName: result.stepName,
      stepPath: stepsConfig[result.bundlePath]?.entrypointPath,
      flowName: stepsConfig[result.bundlePath]?.config?.flows?.[0] || 'unknown',
      environment: environment,
      version: version,
      error: result.error,
      success: result.success,
    }))

    FileManager.writeDeploymentResults(projectDir, deploymentResults, zipFiles, flowGroups, environment, version)

    logger.success('Deployment process completed successfully')
  }
}
