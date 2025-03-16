import { Express } from 'express'
import { MermaidService } from './mermaid-service'

export const setupMermaidEndpoint = (app: Express, mermaidService: MermaidService) => {
  // Get mermaid diagram for a specific flow
  app.get('/flows/:id/mermaid', (req, res) => {
    const { id } = req.params
    const diagram = mermaidService.getDiagram(id)
    
    if (diagram) {
      res.status(200).send({ diagram })
    } else {
      res.status(404).send({ error: 'Mermaid diagram not found for this flow' })
    }
  })
  
  // Get all mermaid diagrams
  app.get('/flows/mermaid', (req, res) => {
    const diagrams = mermaidService.getAllDiagrams()
    res.status(200).send(diagrams)
  })
}