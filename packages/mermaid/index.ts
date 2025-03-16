import { MermaidPlugin } from './src/plugin'

/**
 * Create a plugin instance - this is the entry point for auto-discovery
 * @returns A new Mermaid plugin instance
 */
export function createPlugin(): MermaidPlugin {
  console.log('Creating new MermaidPlugin instance from createPlugin')
  return new MermaidPlugin();
}

// Also expose createPlugin as a named export for plugin systems that might look for it differently
export const createMermaidPlugin = createPlugin;

// Export plugin class and related types
export { MermaidPlugin } from './src/plugin'
export type { MermaidPluginOptions } from './src/types'

// Log that the module was loaded
console.log('Mermaid plugin module loaded, exports:', Object.keys(module.exports));