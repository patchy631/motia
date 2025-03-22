import { createProject } from './project'
import { readline, exitWithError } from './config-utils'

export async function initInfrastructure(options: { 
  name?: string 
  description?: string
  apiKey: string
}): Promise<void> {
  try {
    console.log('🚀 Initializing Motia Infrastructure project...')
    
    // Create the project via API
    await createProject({
      name: options.name,
      description: options.description,
      apiKey: options.apiKey,
    })
    
    readline.close()
  } catch (error) {
    exitWithError('Initialization failed', error)
  }
} 