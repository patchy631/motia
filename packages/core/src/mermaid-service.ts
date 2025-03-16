import fs from 'fs'
import path from 'path'
import { Flow, Step, Emit } from './types'
import { isApiStep, isEventStep, isCronStep, isNoopStep } from './guards'

export class MermaidService {
  private diagramsPath: string

  constructor(private readonly baseDir: string) {
    this.diagramsPath = path.join(baseDir, 'motia-mermaid.json')
    this.ensureDiagramsFile()
  }

  private ensureDiagramsFile(): void {
    if (!fs.existsSync(this.diagramsPath)) {
      fs.writeFileSync(this.diagramsPath, JSON.stringify({}, null, 2))
    }
  }

  private getDiagrams(): Record<string, string> {
    return JSON.parse(fs.readFileSync(this.diagramsPath, 'utf8'))
  }

  private saveDiagram(flowName: string, diagram: string): void {
    const diagrams = this.getDiagrams()
    diagrams[flowName] = diagram
    fs.writeFileSync(this.diagramsPath, JSON.stringify(diagrams, null, 2))
  }

  getDiagram(flowName: string): string | null {
    const diagrams = this.getDiagrams()
    return diagrams[flowName] || null
  }

  getAllDiagrams(): Record<string, string> {
    return this.getDiagrams()
  }

  removeDiagram(flowName: string): void {
    const diagrams = this.getDiagrams()
    delete diagrams[flowName]
    fs.writeFileSync(this.diagramsPath, JSON.stringify(diagrams, null, 2))
  }

  generateFlowDiagram(flowName: string, steps: Step[]): string {
    // Start mermaid flowchart with top-down direction
    let diagram = `flowchart TD\n`;
    
    // Add class definitions for styling with explicit text color
    diagram += `    classDef apiStyle fill:#f96,stroke:#333,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef eventStyle fill:#69f,stroke:#333,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef cronStyle fill:#9c6,stroke:#333,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef noopStyle fill:#3f3a50,stroke:#333,stroke-width:2px,color:#fff\n`;
    
    // Check if we have any steps
    if (!steps || steps.length === 0) {
      return diagram + "    empty[No steps in this flow]";
    }
    
    // Create node definitions with proper format
    steps.forEach(step => {
      const nodeId = this.getNodeId(step)
      const nodeLabel = this.getNodeLabel(step)
      const nodeStyle = this.getNodeStyle(step)
      
      diagram += `    ${nodeId}${nodeLabel}${nodeStyle}\n`
    });
    
    // Build a new string for connections to avoid side effects
    let connectionsStr = '';
    
    // Create connections between nodes
    steps.forEach(sourceStep => {
      const sourceId = this.getNodeId(sourceStep)
      
      if (isApiStep(sourceStep)) {
        if (sourceStep.config.emits && Array.isArray(sourceStep.config.emits)) {
          connectionsStr += this.generateConnections(sourceStep.config.emits, sourceStep, steps, sourceId);
        }
        if (sourceStep.config.virtualEmits && Array.isArray(sourceStep.config.virtualEmits)) {
          connectionsStr += this.generateConnections(sourceStep.config.virtualEmits, sourceStep, steps, sourceId);
        }
      } else if (isEventStep(sourceStep)) {
        if (sourceStep.config.emits && Array.isArray(sourceStep.config.emits)) {
          connectionsStr += this.generateConnections(sourceStep.config.emits, sourceStep, steps, sourceId);
        }
        if (sourceStep.config.virtualEmits && Array.isArray(sourceStep.config.virtualEmits)) {
          connectionsStr += this.generateConnections(sourceStep.config.virtualEmits, sourceStep, steps, sourceId);
        }
      } else if (isCronStep(sourceStep)) {
        if (sourceStep.config.emits && Array.isArray(sourceStep.config.emits)) {
          connectionsStr += this.generateConnections(sourceStep.config.emits, sourceStep, steps, sourceId);
        }
        if (sourceStep.config.virtualEmits && Array.isArray(sourceStep.config.virtualEmits)) {
          connectionsStr += this.generateConnections(sourceStep.config.virtualEmits, sourceStep, steps, sourceId);
        }
      } else if (isNoopStep(sourceStep)) {
        if (sourceStep.config.virtualEmits && Array.isArray(sourceStep.config.virtualEmits)) {
          connectionsStr += this.generateConnections(sourceStep.config.virtualEmits, sourceStep, steps, sourceId);
        }
      }
    });
    
    // Add connections to the diagram
    diagram += connectionsStr;
    
    return diagram;
  }
  
  private generateConnections(emits: Emit[], sourceStep: Step, steps: Step[], sourceId: string): string {
    let connections = '';
    
    if (!emits || !Array.isArray(emits) || emits.length === 0) {
      return connections;
    }
    
    emits.forEach(emit => {
      const topic = typeof emit === 'string' ? emit : emit.topic;
      const label = typeof emit === 'string' ? topic : (emit.label || topic);
      
      steps.forEach(targetStep => {
        // Check for regular subscribes in event steps
        if (isEventStep(targetStep) && 
            targetStep.config.subscribes && 
            Array.isArray(targetStep.config.subscribes) && 
            targetStep.config.subscribes.includes(topic)) {
          const targetId = this.getNodeId(targetStep);
          connections += `    ${sourceId} -->|${label}| ${targetId}\n`;
        } 
        // Check for virtual subscribes in noop steps
        else if (isNoopStep(targetStep) && 
                  targetStep.config.virtualSubscribes && 
                  Array.isArray(targetStep.config.virtualSubscribes) && 
                  targetStep.config.virtualSubscribes.includes(topic)) {
          const targetId = this.getNodeId(targetStep);
          connections += `    ${sourceId} -->|${label}| ${targetId}\n`;
        }
        // Check if API or Cron steps have virtualSubscribes (unusual but possible)
        else if ((isApiStep(targetStep) || isCronStep(targetStep)) && 
                  targetStep.config.virtualSubscribes && 
                  Array.isArray(targetStep.config.virtualSubscribes) && 
                  targetStep.config.virtualSubscribes.includes(topic)) {
          const targetId = this.getNodeId(targetStep);
          connections += `    ${sourceId} -->|${label}| ${targetId}\n`;
        }
      });
    });
    
    return connections;
  }
  
  private getNodeId(step: Step): string {
    // Create a valid mermaid node ID from the file path
    return step.filePath.replace(/[^a-zA-Z0-9]/g, '_')
  }
  
  private getNodeLabel(step: Step): string {
    // Get display name for node
    const displayName = step.config.name || path.basename(step.filePath, path.extname(step.filePath));
    // Add node type prefix to help distinguish types
    let prefix = '';
    
    if (isApiStep(step)) prefix = '🌐 ';
    else if (isEventStep(step)) prefix = '🔔 ';
    else if (isCronStep(step)) prefix = '⏰ ';
    else if (isNoopStep(step)) prefix = '⚙️ ';
    
    // Create a node label with the step name
    return `["${prefix}${displayName}"]`
  }
  
  private getNodeStyle(step: Step): string {
    // Apply style class based on step type
    if (isApiStep(step)) return ':::apiStyle'
    if (isEventStep(step)) return ':::eventStyle'
    if (isCronStep(step)) return ':::cronStyle'
    if (isNoopStep(step)) return ':::noopStyle'
    return ''
  }
  
  updateFlow(flowName: string, flow: Flow): void {
    // Debug log to help troubleshoot flow data
    console.debug(`Generating mermaid diagram for flow: ${flowName} with ${flow.steps.length} steps`);
    
    // Log step information to help diagnose connection issues
    flow.steps.forEach(step => {
      if (isApiStep(step)) {
        console.debug(`API Step ${step.config.name || step.filePath}: emits=${JSON.stringify(step.config.emits)}, virtualEmits=${JSON.stringify(step.config.virtualEmits)}`);
      } else if (isEventStep(step)) {
        console.debug(`Event Step ${step.config.name || step.filePath}: subscribes=${JSON.stringify(step.config.subscribes)}, emits=${JSON.stringify(step.config.emits)}, virtualEmits=${JSON.stringify(step.config.virtualEmits)}`);
      } else if (isCronStep(step)) {
        console.debug(`Cron Step ${step.config.name || step.filePath}: emits=${JSON.stringify(step.config.emits)}, virtualEmits=${JSON.stringify(step.config.virtualEmits)}`);
      } else if (isNoopStep(step)) {
        console.debug(`Noop Step ${step.config.name || step.filePath}: virtualSubscribes=${JSON.stringify(step.config.virtualSubscribes)}, virtualEmits=${JSON.stringify(step.config.virtualEmits)}`);
      }
    });
    
    const diagram = this.generateFlowDiagram(flowName, flow.steps)
    this.saveDiagram(flowName, diagram)
  }
}