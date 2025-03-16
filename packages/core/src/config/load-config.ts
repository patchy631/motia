import fs from 'fs'
import path from 'path'
import { globalLogger } from '../logger'

/**
 * Basic configuration interface
 */
export interface MotiaConfig {
  state?: {
    adapter?: string
    [key: string]: any
  }
  plugins?: {
    [pluginName: string]: {
      enabled?: boolean
      [key: string]: any
    }
  }
  [key: string]: any
}

/**
 * Check if yaml module is available
 */
function isYamlAvailable(): boolean {
  try {
    require.resolve('yaml')
    return true
  } catch (e) {
    return false
  }
}

/**
 * Load configuration from YAML file
 */
function loadYamlConfig(configPath: string): MotiaConfig {
  try {
    // Dynamically import yaml to avoid direct dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const yaml = require('yaml')
    const content = fs.readFileSync(configPath, 'utf8')
    return yaml.parse(content) || {}
  } catch (error) {
    globalLogger.error(`Error parsing YAML config: ${error instanceof Error ? error.message : String(error)}`)
    return {}
  }
}

/**
 * Load configuration from JSON file
 */
function loadJsonConfig(configPath: string): MotiaConfig {
  try {
    const content = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(content) || {}
  } catch (error) {
    globalLogger.error(`Error parsing JSON config: ${error instanceof Error ? error.message : String(error)}`)
    return {}
  }
}

/**
 * Load configuration from file
 */
export function loadConfig(baseDir: string = process.cwd()): MotiaConfig {
  const yamlPath = path.join(baseDir, 'config.yml')
  const yamlPath2 = path.join(baseDir, 'config.yaml')
  const jsonPath = path.join(baseDir, 'config.json')
  
  // Check for YAML configuration (preferred)
  if (fs.existsSync(yamlPath) && isYamlAvailable()) {
    globalLogger.debug(`Loading configuration from ${yamlPath}`)
    return loadYamlConfig(yamlPath)
  }
  
  // Check for alternate YAML extension
  if (fs.existsSync(yamlPath2) && isYamlAvailable()) {
    globalLogger.debug(`Loading configuration from ${yamlPath2}`)
    return loadYamlConfig(yamlPath2)
  }
  
  // Fall back to JSON configuration
  if (fs.existsSync(jsonPath)) {
    globalLogger.debug(`Loading configuration from ${jsonPath}`)
    return loadJsonConfig(jsonPath)
  }
  
  globalLogger.debug('No configuration file found, using defaults')
  return {}
}

/**
 * Get plugin configuration
 */
export function getPluginConfig<T = Record<string, any>>(
  config: MotiaConfig, 
  pluginName: string
): T & { enabled: boolean } {
  const pluginConfig = config.plugins?.[pluginName] || {}
  return {
    enabled: pluginConfig.enabled !== false, // Enabled by default
    ...pluginConfig
  } as T & { enabled: boolean }
}