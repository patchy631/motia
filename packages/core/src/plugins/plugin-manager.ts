import { Express } from 'express'
import { Flow } from '../types'
import { globalLogger } from '../logger'
import { MotiaPlugin } from './plugin-interface'

export class PluginManager {
  private plugins: MotiaPlugin[] = []
  private pluginOptions: Record<string, Record<string, any>> = {}
  private app: Express
  
  constructor(app: Express) {
    this.app = app
  }
  
  /**
   * Set options for a plugin before it's loaded
   * @param pluginName Name of the plugin
   * @param options Plugin options
   */
  setPluginOptions(pluginName: string, options: Record<string, any>): void {
    this.pluginOptions[pluginName] = options
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
      
      // No logging here - we'll do a single log entry for all plugins
    } catch (error) {
      // Silent fail with error re-throw
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
    // We'll use a single log line at the end to summarize what was loaded
    try {
      const fs = require('fs')
      const path = require('path')
      
      // Check node_modules for @motiadev packages
      const nodeModulesDir = path.join(process.cwd(), 'node_modules', '@motiadev')
      
      if (!fs.existsSync(nodeModulesDir)) {
        return
      }
      
      const dirs = fs.readdirSync(nodeModulesDir)
      
      // List of patterns or package names that identify plugins
      const pluginPatterns = [
        'mermaid',          // Exact match for mermaid plugin
        /^.*-plugin$/       // Pattern match for -plugin suffix
      ]
      
      // Filter potential plugin packages
      const potentialPlugins = dirs.filter((dir: string) => {
        return pluginPatterns.some(pattern => {
          if (typeof pattern === 'string') {
            return pattern === dir
          } else if (pattern instanceof RegExp) {
            return pattern.test(dir)
          }
          return false
        })
      })
      
      if (potentialPlugins.length === 0) {
        return
      }
      
      // Load plugins and register them
      const loadedPlugins: string[] = []
      
      for (const dir of potentialPlugins) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pluginModule = require(`@motiadev/${dir}`)
          
          if (typeof pluginModule.createPlugin === 'function') {
            const plugin = pluginModule.createPlugin()
            
            // Apply any configuration options set for this plugin
            const options = this.pluginOptions[plugin.name] || {}
            
            this.registerPlugin(plugin, options)
            loadedPlugins.push(plugin.name)
          }
        } catch (error) {
          // Silently fail - errors with plugin loading shouldn't disrupt the application
        }
      }
      
      // Log a single summary line if any plugins were loaded
      if (loadedPlugins.length > 0) {
        const pluginNames = loadedPlugins.join(', ')
        
        // Add some visual separation with a plugin banner
        console.log('\n➜ [PLUGINS] ' + '─'.repeat(50))
        console.log(`➜ [PLUGINS] Loaded: ${pluginNames}`)
        console.log('➜ [PLUGINS] ' + '─'.repeat(50) + '\n')
        
        // Also log to the regular logger for completeness
        const logger = globalLogger.child({ component: 'PluginManager' })
        logger.debug(`Loaded plugins: ${pluginNames}`)
      }
    } catch (error) {
      // No logging - silent failure
    }
  }
}