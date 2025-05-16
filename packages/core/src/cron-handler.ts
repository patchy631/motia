import * as cron from 'node-cron'
import { callStepFile } from './call-step-file'
import { LockedData } from './locked-data'
import { globalLogger } from './logger'
import { StateAdapter } from './state/state-adapter'
import { CronConfig, EventManager, Step } from './types'
import { LoggerFactory } from './LoggerFactory'
import { generateTraceId } from './generate-trace-id'
import type { Telemetry } from './telemetry/types'

export type CronManager = {
  createCronJob: (step: Step<CronConfig>) => void
  removeCronJob: (step: Step<CronConfig>) => void
  close: () => void
}

export const setupCronHandlers = (
  lockedData: LockedData,
  eventManager: EventManager,
  state: StateAdapter,
  loggerFactory: LoggerFactory,
  telemetry?: Telemetry
) => {
  const cronJobs = new Map<string, cron.ScheduledTask>()
  const printer = lockedData.printer

  const createCronJob = (step: Step<CronConfig>) => {
    const { config, filePath } = step
    const { cron: cronExpression, name: stepName, flows } = config

    if (!cron.validate(cronExpression)) {
      globalLogger.error('[cron handler] invalid cron expression', {
        expression: cronExpression,
        step: stepName,
      })
      
      telemetry?.metrics.incrementCounter('cron.validation.errors', 1, {
        step_name: stepName,
        expression: cronExpression,
      })
      
      return
    }

    globalLogger.debug('[cron handler] setting up cron job', {
      filePath,
      step: stepName,
      cron: cronExpression,
    })
    
    telemetry?.metrics.incrementCounter('cron.jobs.created', 1, {
      step_name: stepName,
      expression: cronExpression,
    })

    const task = cron.schedule(cronExpression, async () => {
      const traceId = generateTraceId()
      const logger = loggerFactory.create({ traceId, flows, stepName })
      
      // Record cron job execution
      telemetry?.metrics.incrementCounter('cron.execution', 1, {
        step_name: stepName,
        expression: cronExpression,
      })
      
      const startTime = performance.now()

      try {
        await callStepFile({
          contextInFirstArg: true,
          step,
          eventManager,
          printer,
          state,
          traceId,
          logger,
          telemetry,
        })
        
        // Record successful execution duration
        const duration = performance.now() - startTime
        telemetry?.metrics.recordHistogram('cron.execution.duration_ms', duration, {
          step_name: stepName,
          success: 'true',
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Record error and duration
        const duration = performance.now() - startTime
        telemetry?.metrics.recordHistogram('cron.execution.duration_ms', duration, {
          step_name: stepName,
          success: 'false',
        })
        
        telemetry?.metrics.incrementCounter('cron.execution.errors', 1, {
          step_name: stepName,
          expression: cronExpression,
          error_type: error.name || 'unknown',
          error_message: error.message || '',
        })

        telemetry?.tracer.recordException(error)
        
        logger.error('[cron handler] error executing cron job', {
          error: error.message,
          step: step.config.name,
        })
      }
    })

    cronJobs.set(step.filePath, task)
  }

  const removeCronJob = (step: Step<CronConfig>) => {
    const task = cronJobs.get(step.filePath)

    if (task) {
      task.stop()
      cronJobs.delete(step.filePath)
      
      telemetry?.metrics.incrementCounter('cron.jobs.removed', 1, {
        step_name: step.config.name,
      })
    }
  }

  const close = () => {
    const jobCount = cronJobs.size
    cronJobs.forEach((task) => task.stop())
    cronJobs.clear()
    
    telemetry?.metrics.incrementCounter('cron.jobs.stopped', jobCount, {
      reason: 'shutdown',
    })
  }

  lockedData.cronSteps().forEach(createCronJob)

  return { createCronJob, removeCronJob, close }
}
