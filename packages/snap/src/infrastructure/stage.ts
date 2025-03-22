import { ApiError, ApiService } from './api-service'
import { exitWithError, getProjectId, question, readConfig, readline, writeConfig } from './config-utils'

export async function createStage(options: { name?: string; description?: string; apiKey: string }): Promise<void> {
  try {
    const config = readConfig()

    if (!config) {
      exitWithError('No motia.config.json found. Please initialize the project first with motia infrastructure init')
    }

    const stageName = options.name || (await question('Stage name: '))
    const stageDescription = options.description || (await question('Stage description (optional): '))
    const projectId = config.id

    const apiKey = options.apiKey

    if (!stageName) {
      exitWithError('Stage name is required')
    }

    if (!projectId) {
      exitWithError('Project ID is required')
    }

    if (!config.stages) {
      config.stages = {}
    }

    // Check if stage already exists
    if (config.stages[stageName]) {
      const overwrite = await question(`Stage "${stageName}" already exists in config. Overwrite? (y/N): `)
      if (overwrite.toLowerCase() !== 'y') {
        console.log('⚠️ Stage creation cancelled')
        readline.close()
        return
      }
    }

    console.log(`Creating stage "${stageName}" via API...`)

    try {
      const apiService = new ApiService(apiKey)

      const stageData = await apiService.createStage(stageName, projectId, stageDescription)

      // Store the stage data in the config
      config.stages[stageName] = {
        name: stageName,
        description: stageDescription || undefined,
        apiUrl: stageData.apiUrl,
        id: stageData.id,
      }

      if (Object.keys(config.stages).length === 1) {
        config.selectedStage = stageName
      }

      if (writeConfig(config)) {
        console.log(`✅ Stage "${stageName}" created successfully.`)
        console.log(`Stage ID: ${stageData.id}`)

        if (config.selectedStage === stageName) {
          console.log(`🚀 Stage "${stageName}" is now the selected stage.`)
        }

        if (stageData.apiUrl) {
          console.log(`ℹ️ API URL for stage "${stageName}": ${stageData.apiUrl}`)
        }
      }
    } catch (error) {
      handleApiError(error, 'Stage creation via API failed. Please check your API key and project ID.')
    }

    readline.close()
  } catch (error) {
    exitWithError('Stage creation failed', error)
  }
}

export async function selectStage(options: { name?: string }): Promise<void> {
  try {
    const config = readConfig()

    if (!config) {
      exitWithError('No motia.config.json found. Please initialize the project first with motia infrastructure init')
    }

    if (!config.stages || Object.keys(config.stages).length === 0) {
      exitWithError('No stages found. Please create a stage first with motia infrastructure stage create')
    }

    let stageName = options.name

    // If no stage name provided, list stages and ask to select one
    if (!stageName) {
      console.log('Available stages:')

      Object.keys(config.stages).forEach((name, index) => {
        const stage = config.stages![name]
        const isSelected = name === config.selectedStage
        console.log(
          `${index + 1}. ${name}${isSelected ? ' (currently selected)' : ''}${stage.description ? ` - ${stage.description}` : ''}`,
        )
      })

      const stageNumber = await question('\nEnter stage number to select: ')
      const stageIndex = parseInt(stageNumber) - 1

      if (isNaN(stageIndex) || stageIndex < 0 || stageIndex >= Object.keys(config.stages).length) {
        exitWithError('Invalid stage number')
      }

      stageName = Object.keys(config.stages)[stageIndex]
    } else if (!config.stages[stageName]) {
      exitWithError(`Stage "${stageName}" not found`)
    }

    // Update selected stage
    config.selectedStage = stageName

    // Save the config
    if (writeConfig(config)) {
      console.log(`🚀 Stage "${stageName}" is now the selected stage.`)

      // Display the API URL for the selected stage
      const stage = config.stages[stageName]
      if (stage.apiUrl) {
        console.log(`ℹ️ API URL for stage "${stageName}": ${stage.apiUrl}`)
      }
    }

    readline.close()
  } catch (error) {
    exitWithError('Stage selection failed', error)
  }
}

export async function listStages(options: { apiKey?: string; useApi?: boolean }): Promise<void> {
  try {
    const config = readConfig()

    if (!config) {
      exitWithError('No motia.config.json found. Please initialize the project first with motia infrastructure init')
    }

    // If using API to fetch stages
    if (options.useApi) {
      const apiKey = options.apiKey || (await question('API key (for authentication): '))
      const projectId = getProjectId()

      if (!projectId) {
        exitWithError('Project ID is required')
      }

      if (!apiKey) {
        exitWithError('API key is required for authentication')
      }

      try {
        console.log('Fetching stages from API...')
        const apiService = new ApiService(apiKey)
        const stages = await apiService.getStages(projectId)

        if (stages.length === 0) {
          console.log('No stages found.')
          readline.close()
          return
        }

        console.log('\nStages:')
        stages.forEach((stage) => {
          const isSelected = stage.name === config.selectedStage
          console.log(`- ${stage.name}${isSelected ? ' (currently selected)' : ''} (ID: ${stage.id})`)
          if (stage.description) {
            console.log(`  Description: ${stage.description}`)
          }
          if (stage.apiUrl) {
            console.log(`  API URL: ${stage.apiUrl}`)
          }
          console.log('')
        })
      } catch (error) {
        handleApiError(error)
      }
    } else {
      // List stages from local config
      if (!config.stages || Object.keys(config.stages).length === 0) {
        console.log('No stages found in local config.')
        readline.close()
        return
      }

      console.log('\nStages (from local config):')
      Object.keys(config.stages).forEach((name) => {
        const stage = config.stages![name]
        const isSelected = name === config.selectedStage
        console.log(`- ${name}${isSelected ? ' (currently selected)' : ''}${stage.id ? ` (ID: ${stage.id})` : ''}`)
        if (stage.description) {
          console.log(`  Description: ${stage.description}`)
        }
        if (stage.apiUrl) {
          console.log(`  API URL: ${stage.apiUrl}`)
        }
        console.log('')
      })
    }

    readline.close()
  } catch (error) {
    exitWithError('Failed to list stages', error)
  }
}

export async function deleteStage(options: { name?: string; apiKey: string; skipApiDelete?: boolean }): Promise<void> {
  try {
    const config = readConfig()

    if (!config) {
      exitWithError('No motia.config.json found. Please initialize the project first with motia infrastructure init')
    }

    if (!config.stages || Object.keys(config.stages).length === 0) {
      exitWithError('No stages found. Nothing to delete')
    }

    let stageName = options.name

    // If no stage name provided, list stages and ask to select one to delete
    if (!stageName) {
      console.log('Available stages:')

      Object.keys(config.stages).forEach((name, index) => {
        const stage = config.stages![name]
        const isSelected = name === config.selectedStage
        console.log(
          `${index + 1}. ${name}${isSelected ? ' (currently selected)' : ''}${stage.description ? ` - ${stage.description}` : ''}`,
        )
      })

      const stageNumber = await question('\nEnter stage number to delete: ')
      const stageIndex = parseInt(stageNumber) - 1

      if (isNaN(stageIndex) || stageIndex < 0 || stageIndex >= Object.keys(config.stages).length) {
        exitWithError('Invalid stage number')
      }

      stageName = Object.keys(config.stages)[stageIndex]
    }

    if (!config.stages[stageName]) {
      exitWithError(`Stage "${stageName}" not found`)
    }

    const confirm = await question(
      `Are you sure you want to delete stage "${stageName}"? This cannot be undone. (y/N): `,
    )
    if (confirm.toLowerCase() !== 'y') {
      console.log('⚠️ Stage deletion cancelled')
      readline.close()
      return
    }

    const stageId = config.stages[stageName].id
    const projectId = getProjectId()

    // Delete from API if not skipping and we have both IDs
    if (!options.skipApiDelete && stageId && projectId) {
      try {
        console.log(`Deleting stage "${stageName}" from API...`)
        const apiService = new ApiService(options.apiKey)
        await apiService.deleteStage(projectId, stageId)
        console.log(`✅ Stage "${stageName}" deleted from API successfully.`)
      } catch (error) {
        console.error(
          `⚠️ Failed to delete stage "${stageName}" from API:`,
          error instanceof Error ? error.message : 'Unknown error',
        )
        const proceed = await question('Continue with removing from local config? (y/N): ')
        if (proceed.toLowerCase() !== 'y') {
          console.log('⚠️ Stage deletion cancelled')
          readline.close()
          return
        }
      }
    }

    // Delete from local config
    const wasSelected = config.selectedStage === stageName
    delete config.stages[stageName]

    // If the deleted stage was selected, select another one if available
    if (wasSelected) {
      const remainingStages = Object.keys(config.stages)
      if (remainingStages.length > 0) {
        config.selectedStage = remainingStages[0]
      } else {
        config.selectedStage = undefined
      }
    }

    // Save the config
    if (writeConfig(config)) {
      console.log(`✅ Stage "${stageName}" removed from local config.`)

      if (wasSelected && config.selectedStage) {
        console.log(`🚀 Stage "${config.selectedStage}" is now the selected stage.`)
      } else if (wasSelected) {
        console.log('⚠️ No stages left. You should create a new stage.')
      }
    }

    readline.close()
  } catch (error) {
    exitWithError('Stage deletion failed', error)
  }
}

function handleApiError(error: unknown, customMessage?: string): never {
  if ((error as ApiError).status) {
    const apiError = error as ApiError
    console.error(`❌ API request failed: ${apiError.status} ${apiError.message}`)
    if (apiError.details) {
      console.error(`   Details: ${apiError.details}`)
    }
  } else {
    console.error('❌ API request failed:', error instanceof Error ? error.message : 'Unknown error')
  }

  if (customMessage) {
    console.error(customMessage)
  }

  readline.close()
  process.exit(1)
}