import { Express } from 'express';
import { Flow } from '@motiadev/core';

export interface MermaidPluginOptions {
  /**
   * Base directory for storing mermaid diagrams
   * Defaults to process.cwd()
   */
  baseDir?: string;
}

export interface MermaidRenderer {
  /**
   * Render a mermaid diagram for a flow
   */
  renderFlow(flow: Flow): any; // Using 'any' instead of React.ReactNode for simplicity
}

export interface MermaidPluginApi {
  /**
   * Get the mermaid diagram service instance
   */
  getMermaidService(): MermaidService;
  
  /**
   * Get the React component for rendering diagrams
   */
  getMermaidRenderer(): MermaidRenderer;
}

export interface MermaidService {
  /**
   * Get a diagram for a specific flow
   */
  getDiagram(flowName: string): string | null;
  
  /**
   * Get all diagrams
   */
  getAllDiagrams(): Record<string, string>;
  
  /**
   * Remove a diagram
   */
  removeDiagram(flowName: string): void;
  
  /**
   * Update a flow diagram
   */
  updateFlow(flowName: string, flow: Flow): void;
}
