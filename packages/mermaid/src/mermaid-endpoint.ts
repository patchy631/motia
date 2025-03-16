import { Express } from 'express'
import { MermaidService } from './mermaid-service'

export const setupMermaidEndpoint = (app: Express, mermaidService: MermaidService) => {
  console.log('Setting up mermaid endpoints')
  
  // Important: Register the /flows/mermaid route BEFORE the /flows/:id/mermaid route
  // to avoid route conflicts, as Express registers routes in order
  
  // Get all mermaid diagrams
  app.get('/flows/mermaid', (req, res) => {
    console.log('Mermaid endpoint called for all diagrams')
    const diagrams = mermaidService.getAllDiagrams()
    res.status(200).json(diagrams) // Use res.json instead of send
  })
  
  // Get mermaid diagram for a specific flow
  app.get('/flows/:id/mermaid', (req, res) => {
    const { id } = req.params
    console.log(`Mermaid endpoint called for flow: ${id}`)
    const diagram = mermaidService.getDiagram(id)

    if (diagram) {
      console.log(`Found diagram for flow: ${id}`)
      res.status(200).json({ diagram }) // Use res.json instead of send
    } else {
      console.log(`No diagram found for flow: ${id}`)
      res.status(404).json({ error: 'Mermaid diagram not found for this flow' })
    }
  })
  
  // Add debug endpoint that will help with troubleshooting
  app.get('/mermaid-plugin-debug', (req, res) => {
    res.status(200).json({
      service: mermaidService ? 'initialized' : 'missing',
      diagrams: mermaidService.getAllDiagrams(),
      diagramsPath: mermaidService['diagramsPath'] || 'unknown',
      isTestEnvironment: mermaidService['isTestEnvironment'] || false,
      endpoints: ['GET /flows/:id/mermaid', 'GET /flows/mermaid', 'GET /mermaid-plugin-debug'],
      status: 'Plugin is loaded and endpoints are registered'
    })
  })
}