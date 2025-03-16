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
    const baseDir = options.baseDir || process.cwd();
    
    try {
      this.mermaidService = new MermaidService(baseDir, options.diagramsPath);
      
      // Set up API endpoints
      setupMermaidEndpoint(app, this.mermaidService);
      
      // Add a diagnostic endpoint
      app.get('/mermaid-plugin-status', (req, res) => {
        res.json({
          status: 'Plugin loaded',
          name: this.name,
          serviceInitialized: !!this.mermaidService,
          diagramsPath: this.mermaidService['diagramsPath'],
          time: new Date().toISOString()
        });
      });
      
      // No logging - the plugin manager will handle this
    } catch (error) {
      // Add a diagnostic endpoint even if initialization fails
      app.get('/mermaid-plugin-status', (req, res) => {
        res.json({
          status: 'Initialization failed',
          name: this.name,
          error: error instanceof Error ? error.message : String(error),
          time: new Date().toISOString()
        });
      });
      
      // Re-throw the error for the plugin manager to handle
      throw error;
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