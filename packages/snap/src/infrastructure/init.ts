import fs from 'fs'
import path from 'path'
import { createInterface } from 'readline'
import { createProject } from './project'

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
})

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
    console.error('❌ Initialization failed:', error instanceof Error ? error.message : 'Unknown error')
    readline.close()
    process.exit(1)
  }
} 