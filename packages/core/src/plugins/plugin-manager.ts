import { Express } from 'express'
import { Flow } from '../types'
import { globalLogger } from '../logger'
import { MotiaPlugin } from './plugin-interface'

export class PluginManager {
  private plugins: MotiaPlugin[] = []
  private app: Express
  
  constructor(app: Express) {
    this.app = app
  }
  
  /**
   * Register a new plugin
   * @param plugin Plugin to register
   * @param options Plugin options
   */
  registerPlugin(plugin: MotiaPlugin, options?: Record<string, any>): void {
    try {
      // Initialize the plugin
      plugin.initialize(this.app, options)
      
      // Add to registered plugins
      this.plugins.push(plugin)
      
      globalLogger.info(`Plugin registered: ${plugin.name}`)
    } catch (error) {
      globalLogger.error(`Failed to register plugin ${plugin.name}: ${error instanceof Error ? error.message : String(error)}`)
      throw error // Re-throw to allow caller to handle
    }
  }
  
  /**
   * Notify all plugins that a flow has been updated
   * @param flowName Name of the flow
   * @param flow Flow data
   */
  notifyFlowUpdate(flowName: string, flow: Flow): void {
    for (const plugin of this.plugins) {
      if (plugin.onFlowUpdate) {
        try {
          plugin.onFlowUpdate(flowName, flow)
        } catch (error) {
          globalLogger.error(`Error in plugin ${plugin.name}.onFlowUpdate: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
  }
  
  /**
   * Notify all plugins that a flow has been removed
   * @param flowName Name of the flow
   */
  notifyFlowRemove(flowName: string): void {
    for (const plugin of this.plugins) {
      if (plugin.onFlowRemove) {
        try {
          plugin.onFlowRemove(flowName)
        } catch (error) {
          globalLogger.error(`Error in plugin ${plugin.name}.onFlowRemove: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
  }
  
  /**
   * Get a plugin by name
   * @param name Plugin name
   */
  getPlugin(name: string): MotiaPlugin | undefined {
    return this.plugins.find(plugin => plugin.name === name)
  }
  
  /**
   * Check if a plugin is registered
   * @param name Plugin name
   */
  hasPlugin(name: string): boolean {
    return this.plugins.some(plugin => plugin.name === name)
  }
  
  /**
   * Get all registered plugins
   */
  getPlugins(): MotiaPlugin[] {
    return [...this.plugins]
  }
  
  /**
   * Auto-discover and load plugins
   * 
   * This tries to load plugins using Node.js module resolution.
   * It will look for modules matching the pattern @motiadev/*-plugin
   * and attempt to load and register them.
   */
  autoDiscoverPlugins(): void {
    console.log('Starting plugin auto-discovery')
    globalLogger.info('Starting plugin auto-discovery')
    
    try {
      // This is a simplified approach - in a real implementation
      // you'd want more robust plugin discovery
      const fs = require('fs')
      const path = require('path')
      
      // Check node_modules for @motiadev packages
      const nodeModulesDir = path.join(process.cwd(), 'node_modules', '@motiadev')
      console.log(`Looking for plugins in ${nodeModulesDir}`)
      
      if (!fs.existsSync(nodeModulesDir)) {
        console.log('No @motiadev modules found in node_modules directory')
        globalLogger.debug('No @motiadev modules found in node_modules directory')
        return // No @motiadev modules installed
      }
      
      const dirs = fs.readdirSync(nodeModulesDir)
      console.log(`Found @motiadev modules: ${dirs.join(', ')}`)
      globalLogger.debug(`Found @motiadev modules: ${dirs.join(', ')}`)
      
      // Look through all @motiadev packages
      for (const dir of dirs) {
        try {
          console.log(`Attempting to load @motiadev/${dir}...`)
          
          // Try to load the module
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pluginModule = require(`@motiadev/${dir}`)
          
          console.log(`Found @motiadev/${dir} module with exports: ${Object.keys(pluginModule).join(', ')}`)
          globalLogger.debug(`Found @motiadev/${dir} module with exports: ${Object.keys(pluginModule).join(', ')}`)
          
          // Check if it exports a createPlugin function
          if (typeof pluginModule.createPlugin === 'function') {
            console.log(`Creating plugin instance from @motiadev/${dir}`)
            const plugin = pluginModule.createPlugin()
            this.registerPlugin(plugin)
            console.log(`Auto-discovered and registered plugin: ${plugin.name}`)
            globalLogger.info(`Auto-discovered plugin: ${plugin.name}`)
          } else {
            console.log(`Module @motiadev/${dir} does not export a createPlugin function`)
          }
        } catch (error) {
          console.error(`Failed to load plugin from @motiadev/${dir}:`, error)
          globalLogger.debug(`Failed to load plugin from @motiadev/${dir}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
      
      // Log all registered plugins
      console.log(`Plugin discovery complete. Registered plugins: ${this.plugins.map(p => p.name).join(', ') || 'none'}`)
    } catch (error) {
      console.error('Plugin discovery error:', error)
      globalLogger.error(`Error auto-discovering plugins: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}