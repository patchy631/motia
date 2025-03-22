import fs from 'fs'
import path from 'path'
import { createInterface } from 'readline'

export interface Stage {
  name: string
  description?: string
  apiUrl?: string
  id?: string
  projectId?: string
}

export interface ProjectConfig {
  name: string
  description?: string
  id?: string
  selectedStage?: string
  stages?: Record<string, Stage>
}

export const readline = createInterface({
  input: process.stdin,
  output: process.stdout
})

export function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    readline.question(query, (answer) => {
      resolve(answer)
    })
  })
}

export function getConfigPath(): string {
  return path.join(process.cwd(), 'motia.config.json')
}

export function readConfig(): ProjectConfig | null {
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

export function writeConfig(config: ProjectConfig): boolean {
  const configPath = getConfigPath()
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    return true
  } catch (error) {
    console.error('Error writing config file:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

export function getProjectId(): string | null {
  const config = readConfig()
  return config?.id || null
}

export function exitWithError(message: string, error?: unknown): never {
  console.error(`❌ ${message}:`, error instanceof Error ? error.message : 'Unknown error')
  readline.close()
  process.exit(1)
} 