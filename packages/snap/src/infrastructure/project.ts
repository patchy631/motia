import fs from 'fs'
import path from 'path'
import { createInterface } from 'readline'
import { ApiService, Project, API_BASE_URL, ApiError } from './api-service'

interface ProjectConfig {
  name: string
  description?: string
  id?: string
  selectedStage?: string
  stages?: Record<string, {
    name: string
    description?: string
    apiUrl?: string
    id?: string
    projectId?: string
  }>
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
  const configPath = getConfigPath()
  
  if (!fs.existsSync(configPath)) {
    return null
  }
  
  try {
    const configData = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('Error reading config file:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
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

export function getProjectConfig(): ProjectConfig | null {
  const configPath = getConfigPath()
  
  if (!fs.existsSync(configPath)) {
    return null
  }
  
  try {
    const configData = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('Error reading config file:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

export function getProjectId(): string | null {
  const config = getProjectConfig()
  return config?.id || null
}

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
      console.error('❌ Project name is required.')
      readline.close()
      process.exit(1)
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
        console.log(`     motia infrastructure stage create -n <stage-name> -p ${projectData.id} -k <api-key>`)
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
      console.error('Project creation via API failed. Please check your API key.')
      readline.close()
      process.exit(1)
    }
    
    readline.close()
  } catch (error) {
    console.error('❌ Project creation failed:', error instanceof Error ? error.message : 'Unknown error')
    readline.close()
    process.exit(1)
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
      console.error('❌ API key is required for authentication.')
      readline.close()
      process.exit(1)
    }
    
    console.log('Fetching projects...')
    
    try {
      // Create the API service
      const apiService = new ApiService(apiKey, apiBaseUrl)
      
      // Get projects from API
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
  } catch (error) {
    console.error('❌ Failed to list projects:', error instanceof Error ? error.message : 'Unknown error')
    readline.close()
    process.exit(1)
  }
} 