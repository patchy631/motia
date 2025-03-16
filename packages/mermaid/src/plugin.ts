import { Express } from 'express'
import { Flow, globalLogger, MotiaPlugin } from '@motiadev/core'
import { MermaidService } from './mermaid-service'
import { setupMermaidEndpoint } from './mermaid-endpoint'
import { MermaidPluginOptions } from './types'

/**
 * Mermaid plugin for Motia
 */
export class MermaidPlugin implements MotiaPlugin {
  public readonly name = 'mermaid';
  public static readonly PLUGIN_IDENTIFIER = '@motiadev/mermaid';
  private mermaidService!: MermaidService; // Using the definite assignment assertion
  
  /**
   * Initialize the Mermaid plugin
   * @param app Express application
   * @param options Plugin options
   */
  initialize(app: Express, options: MermaidPluginOptions = {}): void {
    console.log('Initializing mermaid plugin');
    const baseDir = options.baseDir || process.cwd();
    
    try {
      this.mermaidService = new MermaidService(baseDir);
      
      // Set up API endpoints
      setupMermaidEndpoint(app, this.mermaidService);
      
      // Add a simple test endpoint to check if the plugin is loaded
      app.get('/mermaid-plugin-status', (req, res) => {
        res.json({
          status: 'Mermaid plugin is loaded and running',
          serviceInitialized: !!this.mermaidService,
          time: new Date().toISOString()
        });
      });
      
      globalLogger.info('Mermaid plugin initialized successfully');
      console.log('Mermaid plugin initialized successfully');
    } catch (error) {
      globalLogger.error(`Failed to initialize mermaid plugin: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Mermaid plugin initialization error:', error);
      
      // Even if there's an error, add a diagnostic endpoint
      app.get('/mermaid-plugin-status', (req, res) => {
        res.json({
          status: 'Mermaid plugin initialization failed',
          error: error instanceof Error ? error.message : String(error),
          time: new Date().toISOString()
        });
      });
    }
  }
  
  /**
   * Called when a flow is updated - regenerates the diagram
   * @param flowName Name of the flow
   * @param flow Flow data
   */
  onFlowUpdate(flowName: string, flow: Flow): void {
    this.mermaidService.updateFlow(flowName, flow);
  }
  
  /**
   * Called when a flow is removed - removes the diagram
   * @param flowName Name of the flow 
   */
  onFlowRemove(flowName: string): void {
    this.mermaidService.removeDiagram(flowName);
  }
  
  /**
   * Get the mermaid service instance
   */
  getMermaidService(): MermaidService {
    return this.mermaidService;
  }
}