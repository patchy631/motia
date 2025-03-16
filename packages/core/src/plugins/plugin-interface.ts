import { Express } from 'express'
import { Flow } from '../types'

/**
 * Interface for Motia plugins
 */
export interface MotiaPlugin {
  /**
   * Name of the plugin
   */
  name: string
  
  /**
   * Initialize the plugin
   * @param app Express application
   * @param options Plugin options
   */
  initialize(app: Express, options?: Record<string, any>): void
  
  /**
   * Called when a flow is updated
   * @param flowName Name of the flow
   * @param flow Flow data
   */
  onFlowUpdate?(flowName: string, flow: Flow): void
  
  /**
   * Called when a flow is removed
   * @param flowName Name of the flow
   */
  onFlowRemove?(flowName: string): void
}