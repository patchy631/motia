import { ZodObject } from 'zod'
import { ApiRouteConfig, CronConfig, EventConfig, Flow, Step } from './types'
import { isApiStep, isCronStep, isEventStep } from './guards'
import { validateStep } from './step-validator'
import { Printer } from './printer'
import type { Telemetry } from './telemetry/types'

type FlowEvent = 'flow-created' | 'flow-removed' | 'flow-updated'
type StepEvent = 'step-created' | 'step-removed' | 'step-updated'

export class LockedData {
  public flows: Record<string, Flow>
  public activeSteps: Step[]
  public devSteps: Step[]
  public printer: Printer
  public telemetry?: Telemetry

  private stepsMap: Record<string, Step>
  private handlers: Record<FlowEvent, ((flowName: string) => void)[]>
  private stepHandlers: Record<StepEvent, ((step: Step) => void)[]>

  constructor(public readonly baseDir: string, telemetry?: Telemetry) {
    this.flows = {}
    this.activeSteps = []
    this.devSteps = []
    this.stepsMap = {}
    this.printer = new Printer(baseDir)
    this.telemetry = telemetry

    this.handlers = {
      'flow-created': [],
      'flow-removed': [],
      'flow-updated': [],
    }

    this.stepHandlers = {
      'step-created': [],
      'step-removed': [],
      'step-updated': [],
    }
  }

  on(event: FlowEvent, handler: (flowName: string) => void) {
    this.handlers[event].push(handler)
  }

  onStep(event: StepEvent, handler: (step: Step) => void) {
    this.stepHandlers[event].push(handler)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventSteps(): Step<EventConfig<ZodObject<any>>>[] {
    return this.activeSteps.filter(isEventStep)
  }

  apiSteps(): Step<ApiRouteConfig>[] {
    return this.activeSteps.filter(isApiStep)
  }

  cronSteps(): Step<CronConfig>[] {
    return this.activeSteps.filter(isCronStep)
  }

  updateStep(oldStep: Step, newStep: Step): boolean {
    this.telemetry?.metrics.incrementCounter('steps.management', 1, {
      operation: 'update',
      step_type: newStep.config.type,
      step_name: newStep.config.name,
    })
    
    if (!this.isValidStep(newStep)) {
      this.deleteStep(oldStep)
      
      this.telemetry?.metrics.incrementCounter('steps.management.errors', 1, {
        operation: 'update',
        reason: 'validation_failed',
        step_type: newStep.config.type,
      })

      return false
    }

    if (oldStep.config.type !== newStep.config.type) {
      this.activeSteps = this.activeSteps.filter((s) => s.filePath !== oldStep.filePath)
      this.devSteps = this.devSteps.filter((s) => s.filePath !== oldStep.filePath)

      if (newStep.config.type === 'noop') {
        this.devSteps.push(newStep)
      } else {
        this.activeSteps.push(newStep)
      }
      
      this.telemetry?.metrics.incrementCounter('steps.type_changed', 1, {
        from_type: oldStep.config.type,
        to_type: newStep.config.type,
      })
    }

    const savedStep = this.stepsMap[newStep.filePath]
    const addedFlows = newStep.config.flows?.filter((flowName) => !oldStep.config.flows?.includes(flowName)) ?? []
    const removedFlows = oldStep.config.flows?.filter((flowName) => !newStep.config.flows?.includes(flowName)) ?? []
    const untouchedFlows = oldStep.config.flows?.filter((flowName) => newStep.config.flows?.includes(flowName)) ?? []

    untouchedFlows.forEach((flowName) => this.onFlowUpdated(flowName))

    for (const flowName of addedFlows) {
      if (!this.flows[flowName]) {
        const flow = this.createFlow(flowName)
        flow.steps.push(savedStep)
      } else {
        this.flows[flowName].steps.push(savedStep)
        this.onFlowUpdated(flowName)
      }
      
      this.telemetry?.metrics.incrementCounter('flows.step_added', 1, {
        flow_name: flowName,
        step_type: newStep.config.type,
      })
    }

    for (const flowName of removedFlows) {
      const flowSteps = this.flows[flowName].steps
      this.flows[flowName].steps = flowSteps.filter(({ filePath }) => filePath !== newStep.filePath)

      if (this.flows[flowName].steps.length === 0) {
        this.removeFlow(flowName)
      } else {
        this.onFlowUpdated(flowName)
      }
      
      this.telemetry?.metrics.incrementCounter('flows.step_removed', 1, {
        flow_name: flowName,
        step_type: oldStep.config.type,
      })
    }

    savedStep.config = newStep.config

    this.stepHandlers['step-updated'].forEach((handler) => handler(newStep))
    this.printer.printStepUpdated(newStep)

    return true
  }

  createStep(step: Step): boolean {
    this.telemetry?.metrics.incrementCounter('steps.management', 1, {
      operation: 'create',
      step_type: step.config.type,
      step_name: step.config.name,
    })
    
    if (!this.isValidStep(step)) {
      this.telemetry?.metrics.incrementCounter('steps.management.errors', 1, {
        operation: 'create',
        reason: 'validation_failed',
        step_type: step.config.type,
      })
      return false
    }

    this.stepsMap[step.filePath] = step

    if (step.config.type === 'noop') {
      this.devSteps.push(step)
      this.telemetry?.metrics.incrementCounter('steps.dev.added', 1, {
        step_type: step.config.type,
      })
    } else {
      this.activeSteps.push(step)
      this.telemetry?.metrics.incrementCounter('steps.active.added', 1, {
        step_type: step.config.type,
      })
    }

    for (const flowName of step.config.flows ?? []) {
      if (!this.flows[flowName]) {
        const flow = this.createFlow(flowName)
        flow.steps.push(step)
      } else {
        this.flows[flowName].steps.push(step)
        this.onFlowUpdated(flowName)
      }
      
      this.telemetry?.metrics.incrementCounter('flows.step_added', 1, {
        flow_name: flowName,
        step_type: step.config.type,
      })
    }

    this.stepHandlers['step-created'].forEach((handler) => handler(step))
    this.printer.printStepCreated(step)

    return true
  }

  deleteStep(step: Step): void {
    this.telemetry?.metrics.incrementCounter('steps.management', 1, {
      operation: 'delete',
      step_type: step.config.type,
      step_name: step.config.name,
    })
    
    // Remove step from active and dev steps
    this.activeSteps = this.activeSteps.filter(({ filePath }) => filePath !== step.filePath)
    this.devSteps = this.devSteps.filter(({ filePath }) => filePath !== step.filePath)

    delete this.stepsMap[step.filePath]

    for (const flowName of step.config.flows ?? []) {
      const stepFlows = this.flows[flowName]?.steps

      if (stepFlows) {
        this.flows[flowName].steps = stepFlows.filter(({ filePath }) => filePath !== step.filePath)
      }

      if (this.flows[flowName].steps.length === 0) {
        this.removeFlow(flowName)
      } else {
        this.onFlowUpdated(flowName)
      }
      
      this.telemetry?.metrics.incrementCounter('flows.step_removed', 1, {
        flow_name: flowName,
        step_type: step.config.type,
      })
    }

    this.stepHandlers['step-removed'].forEach((handler) => handler(step))
    this.printer.printStepRemoved(step)
  }

  private createFlow(flowName: string): Flow {
    this.telemetry?.metrics.incrementCounter('flows.management', 1, {
      operation: 'create',
      flow_name: flowName,
    })
    
    const flow = { name: flowName, description: '', steps: [] }
    this.flows[flowName] = flow
    this.handlers['flow-created'].forEach((handler) => handler(flowName))
    this.printer.printFlowCreated(flowName)

    return flow
  }

  private removeFlow(flowName: string): void {
    this.telemetry?.metrics.incrementCounter('flows.management', 1, {
      operation: 'delete',
      flow_name: flowName,
    })
    
    delete this.flows[flowName]
    this.handlers['flow-removed'].forEach((handler) => handler(flowName))
    this.printer.printFlowRemoved(flowName)
  }

  private onFlowUpdated(flowName: string): void {
    this.telemetry?.metrics.incrementCounter('flows.management', 1, {
      operation: 'update',
      flow_name: flowName,
    })
    
    this.handlers['flow-updated'].forEach((handler) => handler(flowName))
  }

  private isValidStep(step: Step): boolean {
    const validationResult = validateStep(step)
    
    this.telemetry?.metrics.incrementCounter('steps.validation', 1, {
      step_type: step.config.type,
      success: validationResult.success ? 'true' : 'false',
    })

    if (!validationResult.success) {
      this.printer.printValidationError(step.filePath, validationResult)
    }

    return validationResult.success
  }
}
