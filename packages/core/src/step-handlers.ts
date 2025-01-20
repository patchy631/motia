import { EventManager, InternalStateManager, Step } from './types'
import { globalLogger } from './logger'
import { isEventStep } from './guards'
import { callStepFile } from './call-step-file'


export const createStepHandlers = (steps: Step[], eventManager: EventManager, state: InternalStateManager) => {
  globalLogger.debug(`[step handler] creating step handlers for ${steps.length} steps`)

  steps.filter(isEventStep).forEach((step) => {
    const { config, filePath } = step
    const { subscribes } = config

    globalLogger.debug('[step handler] establishing step subscriptions', { filePath, step: step.config.name })

    subscribes.forEach((subscribe) => {
      eventManager.subscribe(subscribe, step.config.name, async (event) => {
        const { logger, ...rest } = event
        globalLogger.debug('[step handler] received event', { event: rest, step: step.config.name })

        try {
          await callStepFile(filePath, step.config.name, event, eventManager, state)
        } catch (error: any) {
          globalLogger.error(`[step handler] error calling step`, {
            error: error.message,
            filePath,
            step: step.config.name,
          })
        }
      })
    })
  })
}
