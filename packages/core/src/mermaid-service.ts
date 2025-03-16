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
    // Start mermaid flowchart
    let diagram = 'flowchart TD\n'
    
    // Add class definitions for styling
    diagram += '    classDef apiStyle fill:#f96,stroke:#333,stroke-width:2px\n'
    diagram += '    classDef eventStyle fill:#69f,stroke:#333,stroke-width:2px\n'
    diagram += '    classDef cronStyle fill:#9c6,stroke:#333,stroke-width:2px\n'
    diagram += '    classDef noopStyle fill:#ccc,stroke:#333,stroke-width:2px\n'
    
    // Create node definitions
    steps.forEach(step => {
      const nodeId = this.getNodeId(step)
      const nodeLabel = this.getNodeLabel(step)
      const nodeStyle = this.getNodeStyle(step)
      
      diagram += `    ${nodeId}${nodeLabel}${nodeStyle}\n`
    })
    
    // Create connections between nodes
    steps.forEach(sourceStep => {
      const sourceId = this.getNodeId(sourceStep)
      
      if (isApiStep(sourceStep)) {
        this.processEmits(sourceStep.config.emits, sourceStep, steps, sourceId, diagram)
        if (sourceStep.config.virtualEmits) {
          this.processEmits(sourceStep.config.virtualEmits, sourceStep, steps, sourceId, diagram)
        }
      } else if (isEventStep(sourceStep)) {
        this.processEmits(sourceStep.config.emits, sourceStep, steps, sourceId, diagram)
        if (sourceStep.config.virtualEmits) {
          this.processEmits(sourceStep.config.virtualEmits, sourceStep, steps, sourceId, diagram)
        }
      } else if (isCronStep(sourceStep)) {
        this.processEmits(sourceStep.config.emits, sourceStep, steps, sourceId, diagram)
        if (sourceStep.config.virtualEmits) {
          this.processEmits(sourceStep.config.virtualEmits, sourceStep, steps, sourceId, diagram)
        }
      } else if (isNoopStep(sourceStep)) {
        if (sourceStep.config.virtualEmits) {
          this.processEmits(sourceStep.config.virtualEmits, sourceStep, steps, sourceId, diagram)
        }
      }
    })
    
    return diagram
  }
  
  private processEmits(emits: Emit[], sourceStep: Step, steps: Step[], sourceId: string, diagram: string): string {
    emits.forEach(emit => {
      const topic = typeof emit === 'string' ? emit : emit.topic
      const label = typeof emit === 'string' ? topic : (emit.label || topic)
      
      steps.forEach(targetStep => {
        if (isEventStep(targetStep) && targetStep.config.subscribes.includes(topic)) {
          const targetId = this.getNodeId(targetStep)
          diagram += `    ${sourceId} -->|${label}| ${targetId}\n`
        } else if (isNoopStep(targetStep) && 
                  targetStep.config.virtualSubscribes && 
                  targetStep.config.virtualSubscribes.includes(topic)) {
          const targetId = this.getNodeId(targetStep)
          diagram += `    ${sourceId} -->|${label}| ${targetId}\n`
        }
      })
    })
    
    return diagram
  }
  
  private getNodeId(step: Step): string {
    // Create a valid mermaid node ID from the file path
    return step.filePath.replace(/[^a-zA-Z0-9]/g, '_')
  }
  
  private getNodeLabel(step: Step): string {
    // Create a node label with the step name
    return `["${step.config.name || path.basename(step.filePath, path.extname(step.filePath))}"]`
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
    const diagram = this.generateFlowDiagram(flowName, flow.steps)
    this.saveDiagram(flowName, diagram)
  }
}