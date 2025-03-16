import { Express } from 'express'
import { MermaidService } from './mermaid-service'

export const setupMermaidEndpoint = (app: Express, mermaidService: MermaidService) => {
  // Important: Register the /flows/mermaid route BEFORE the /flows/:id/mermaid route
  // to avoid route conflicts, as Express registers routes in order
  
  // Get all mermaid diagrams
  app.get('/flows/mermaid', (req, res) => {
    const diagrams = mermaidService.getAllDiagrams()
    res.status(200).json(diagrams)
  })
  
  // Get mermaid diagram for a specific flow
  app.get('/flows/:id/mermaid', (req, res) => {
    const { id } = req.params
    const diagram = mermaidService.getDiagram(id)

    if (diagram) {
      res.status(200).json({ diagram })
    } else {
      res.status(404).json({ error: 'Mermaid diagram not found for this flow' })
    }
  })
  
  // Add debug endpoint
  app.get('/mermaid-plugin-debug', (req, res) => {
    res.status(200).json({
      service: mermaidService ? 'initialized' : 'missing',
      diagrams: Object.keys(mermaidService.getAllDiagrams()),
      endpoints: ['GET /flows/:id/mermaid', 'GET /flows/mermaid']
    })
  })
}