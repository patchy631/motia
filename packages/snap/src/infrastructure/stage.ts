import fs from 'fs'
import path from 'path'
import { createInterface } from 'readline'
import { ApiService, Stage as ApiStage, API_BASE_URL, ApiError } from './api-service'
import { getProjectConfig, getProjectId } from './project'

interface Stage {
  name: string
  description?: string
  apiUrl?: string
  id?: string
  projectId?: string
}

interface ProjectConfig {
  name: string
  description?: string
  id?: string
  selectedStage?: string
  stages?: Record<string, Stage>
}

interface CreateStageResponse {
  id: string
  name: string
  description?: string
  projectId: string
  apiUrl?: string
}

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    readline.question(query, (answer) => {
      resolve(answer)
    })
  })
}

function getConfigPath(): string {
  return path.join(process.cwd(), 'motia.config.json')
}

function readConfig(): ProjectConfig | null {
  return getProjectConfig()
}

function writeConfig(config: ProjectConfig): boolean {
  const configPath = getConfigPath()
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    return true
  } catch (error) {
    console.error('Error writing config file:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

export async function createStage(options: {
  name?: string
  description?: string
  apiKey: string
}): Promise<void> {
  try {
    const config = readConfig()
    
    if (!config) {
      console.error('❌ No motia.config.json found. Please initialize the project first with motia infrastructure init.')
      readline.close()
      process.exit(1)
    }
    
    const stageName = options.name || await question('Stage name: ')
    const stageDescription = options.description || await question('Stage description (optional): ')
    const projectId = config.id
    
    const apiKey = options.apiKey
    
    if (!stageName) {
      console.error('❌ Stage name is required.')
      readline.close()
      process.exit(1)
    }
    
    if (!projectId) {
      console.error('❌ Project ID is required.')
      readline.close()
      process.exit(1)
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
      if ((error as ApiError).status) {
        const apiError = error as ApiError
        console.error(`❌ API request failed: ${apiError.status} ${apiError.message}`)
        if (apiError.details) {
          console.error(`   Details: ${apiError.details}`)
        }
      } else {
        console.error('❌ API request failed:', error instanceof Error ? error.message : 'Unknown error')
      }
      console.error('Stage creation via API failed. Please check your API key and project ID.')
      readline.close()
      process.exit(1)
    }
    
    readline.close()
  } catch (error) {
    console.error('❌ Stage creation failed:', error instanceof Error ? error.message : 'Unknown error')
    readline.close()
    process.exit(1)
  }
}

export async function selectStage(options: {
  name?: string
}): Promise<void> {
  try {
    const config = readConfig()
    
    if (!config) {
      console.error('❌ No motia.config.json found. Please initialize the project first with motia infrastructure init.')
      readline.close()
      process.exit(1)
    }
    
    if (!config.stages || Object.keys(config.stages).length === 0) {
      console.error('❌ No stages found. Please create a stage first with motia infrastructure stage create.')
      readline.close()
      process.exit(1)
    }
    
    let stageName = options.name
    
    // If no stage name provided, list stages and ask to select one
    if (!stageName) {
      console.log('Available stages:')
      
      Object.keys(config.stages).forEach((name, index) => {
        const stage = config.stages![name]
        const isSelected = name === config.selectedStage
        console.log(`${index + 1}. ${name}${isSelected ? ' (currently selected)' : ''}${stage.description ? ` - ${stage.description}` : ''}`)
      })
      
      const stageNumber = await question('\nEnter stage number to select: ')
      const stageIndex = parseInt(stageNumber) - 1
      
      if (isNaN(stageIndex) || stageIndex < 0 || stageIndex >= Object.keys(config.stages).length) {
        console.error('❌ Invalid stage number.')
        readline.close()
        process.exit(1)
      }
      
      stageName = Object.keys(config.stages)[stageIndex]
    } else if (!config.stages[stageName]) {
      console.error(`❌ Stage "${stageName}" not found.`)
      readline.close()
      process.exit(1)
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
    console.error('❌ Stage selection failed:', error instanceof Error ? error.message : 'Unknown error')
    readline.close()
    process.exit(1)
  }
}

export async function listStages(options: {
  apiKey?: string
  useApi?: boolean
}): Promise<void> {
  try {
    const config = readConfig()
    
    if (!config) {
      console.error('❌ No motia.config.json found. Please initialize the project first with motia infrastructure init.')
      readline.close()
      process.exit(1)
    }
    
    // If using API to fetch stages
    if (options.useApi) {
      const apiKey = options.apiKey || await question('API key (for authentication): ')
      const projectId = getProjectId()
      
      if (!projectId) {
        console.error('❌ Project ID is required.')
        readline.close()
        process.exit(1)
      }
      
      if (!apiKey) {
        console.error('❌ API key is required for authentication.')
        readline.close()
        process.exit(1)
      }
      
      console.log('Fetching stages from API...')
      
      try {
        const apiService = new ApiService(apiKey)
        
        const stages = await apiService.getStages(projectId)
        
        if (stages.length === 0) {
          console.log('No stages found.')
          readline.close()
          return
        }
        
        console.log('Stages:')
        
        stages.forEach((stage) => {
          const isInConfig = config.stages && config.stages[stage.name]
          const isSelected = config.selectedStage === stage.name
          console.log(`- ${stage.name}${isSelected ? ' (selected)' : ''}${isInConfig ? '' : ' (not in config)'}`)
          console.log(`  ID: ${stage.id}`)
          if (stage.description) console.log(`  Description: ${stage.description}`)
          if (stage.apiUrl) console.log(`  API URL: ${stage.apiUrl}`)
          console.log('')
        })
        
      } catch (error) {
        if ((error as ApiError).status) {
          const apiError = error as ApiError
          console.error(`❌ API request failed: ${apiError.status} ${apiError.message}`)
          if (apiError.details) {
            console.error(`   Details: ${apiError.details}`)
          }
        } else {
          console.error('❌ API request failed:', error instanceof Error ? error.message : 'Unknown error')
        }
        readline.close()
        process.exit(1)
      }
      
      readline.close()
      return
    }
    
    // Local listing from config file
    if (!config.stages || Object.keys(config.stages).length === 0) {
      console.log('No stages found in config. Create one with motia infrastructure stage create.')
      readline.close()
      return
    }
    
    console.log('Stages (from local config):')
    
    Object.keys(config.stages).forEach((name) => {
      const stage = config.stages![name]
      const isSelected = name === config.selectedStage
      console.log(`- ${name}${isSelected ? ' (selected)' : ''}`)
      if (stage.id) console.log(`  ID: ${stage.id}`)
      if (stage.description) console.log(`  Description: ${stage.description}`)
      if (stage.apiUrl) console.log(`  API URL: ${stage.apiUrl}`)
      console.log('')
    })
    
    readline.close()
  } catch (error) {
    console.error('❌ Failed to list stages:', error instanceof Error ? error.message : 'Unknown error')
    readline.close()
    process.exit(1)
  }
} 