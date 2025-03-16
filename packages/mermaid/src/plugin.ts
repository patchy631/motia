import { Express } from 'express'
import { Flow, globalLogger, MotiaPlugin } from '@motiadev/core'
import { MermaidService } from './mermaid-service'
import { setupMermaidEndpoint } from './mermaid-endpoint'
import { MermaidPluginOptions } from './types'

// Define a limited Flow type for type safety
type FlowLike = {
  name: string;
  steps: any[];
  [key: string]: any;
}

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
      
      // Access the locked data to update all flows on startup
      const lockedData = app.locals.lockedData;
      if (lockedData && typeof lockedData.flows === 'object' && lockedData.flows !== null) {
        // Generate diagrams for all existing flows
        Object.entries(lockedData.flows).forEach(([flowName, flow]) => {
          // Type safety check
          if (flow && typeof flow === 'object' && Array.isArray((flow as any).steps)) {
            this.onFlowUpdate(flowName, flow as FlowLike);
          }
        });
      }
      
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
  onFlowUpdate(flowName: string, flow: Flow | FlowLike): void {
    this.mermaidService.updateFlow(flowName, flow as Flow);
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