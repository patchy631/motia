import { ApiService, API_BASE_URL, ApiError } from './api-service'
import { 
  ProjectConfig,
  readConfig,
  writeConfig, 
  question, 
  readline, 
  exitWithError 
} from './config-utils'

export async function createProject(options: {
  name?: string
  description?: string
  apiKey: string
}): Promise<void> {
  try {
    const apiKey = options.apiKey
    const projectName = options.name || await question('Project name: ')
    const projectDescription = options.description || await question('Project description (optional): ')
    
    if (!projectName) {
      exitWithError('Project name is required')
    }
    
    console.log(`Creating project "${projectName}" via API...`)
    
    try {
      const existingConfig = readConfig()
      if (existingConfig) {
        const overwrite = await question('motia.config.json already exists. Overwrite? (y/N): ')
        if (overwrite.toLowerCase() !== 'y') {
          console.log('⚠️ Project creation cancelled at config write step')
          readline.close()
          return
        }
      }

      const apiService = new ApiService(apiKey)
      
      const projectData = await apiService.createProject(projectName, projectDescription)

      // Initialize the config
      const config: ProjectConfig = {
        name: projectName,
        description: projectDescription || undefined,
        id: projectData.id,
        selectedStage: existingConfig?.selectedStage || undefined,
        stages: existingConfig?.stages || {},
      }

      // Save the config
      if (writeConfig(config)) {
        console.log(`✅ Project "${projectName}" created successfully`)
        console.log(`Project ID: ${projectData.id}`)
        
        // Note about API key
        console.log('\nℹ️ API key is not stored in the config for security reasons')
        console.log('You will need to provide it when running commands that require authentication')
        
        // Next steps
        console.log('\nNext steps:')
        console.log('  1. Create a stage with: motia infrastructure stage create')
        console.log(`     motia infrastructure stage create -n <stage-name> -k <api-key>`)
      }
    } catch (error) {
      handleApiError(error, 'Project creation via API failed. Please check your API key.')
    }
    
    readline.close()
  } catch (error) {
    exitWithError('Project creation failed', error)
  }
}

export async function listProjects(options: {
  apiKey?: string
  apiBaseUrl?: string
}): Promise<void> {
  try {
    const apiKey = options.apiKey || await question('API key (for authentication): ')
    const apiBaseUrl = options.apiBaseUrl || API_BASE_URL
    
    if (!apiKey) {
      exitWithError('API key is required for authentication')
    }
    
    console.log('Fetching projects...')
    
    try {
      const apiService = new ApiService(apiKey, apiBaseUrl)
      const projects = await apiService.getProjects()
      
      if (projects.length === 0) {
        console.log('No projects found.')
        readline.close()
        return
      }
      
      console.log('Projects:')
      
      projects.forEach((project) => {
        console.log(`- ${project.name} (ID: ${project.id})`)
        if (project.description) {
          console.log(`  Description: ${project.description}`)
        }
        console.log('')
      })
      
    } catch (error) {
      handleApiError(error)
    }
    
    readline.close()
  } catch (error) {
    exitWithError('Failed to list projects', error)
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