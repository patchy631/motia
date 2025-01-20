import { randomUUID } from 'crypto'
import { Express } from 'express'
import fs from 'fs'
import zodToJsonSchema from 'zod-to-json-schema'
import { Emit, LockedData, Step } from './types'
import { isApiStep, isEventStep, isNoopStep } from './guards'
import { getStepLanguage } from './get-step-language'

type FlowListResponse = {
  id: string
  name: string
}

type FlowStepResponse = {
  id: string
  name: string
  type: 'event' | 'api' | 'noop'
  description?: string
  subscribes?: string[]
  emits: Emit[]
  action?: 'webhook'
  webhookUrl?: string
  bodySchema?: any
  language?: string
  nodeComponentPath?: string
}

type FlowResponse = FlowListResponse & {
  steps: FlowStepResponse[]
}

export const generateFlowsList = (flows: LockedData['flows']): FlowResponse[] => {
  const list: FlowResponse[] = []

  Object.keys(flows).forEach((flowId) => {
    const steps: FlowStepResponse[] = []
    const flowSteps = flows[flowId].steps

    flowSteps.forEach((step) => {
      const filePathWithoutExtension = step.filePath.replace(/\.[^/.]+$/, '')
      const tsxPath = filePathWithoutExtension + '.tsx'
      const nodeComponentPath = fs.existsSync(tsxPath) ? tsxPath : undefined

      if (isApiStep(step)) {
        steps.push({
          id: randomUUID(),
          type: 'api',
          name: step.config.name,
          description: step.config.description,
          emits: [...step.config.emits, ...(step.config.virtualEmits ?? [])],
          subscribes: step.config.virtualSubscribes ?? undefined,
          action: 'webhook',
          language: getStepLanguage(step.filePath),
          webhookUrl: `${step.config.method} ${step.config.path}`,
          bodySchema: step?.config.bodySchema ? zodToJsonSchema(step.config.bodySchema) : undefined,
          nodeComponentPath,
        })
      } else if (isEventStep(step)) {
        steps.push({
          id: randomUUID(),
          type: 'event',
          name: step.config.name,
          description: step.config.description,
          emits: [...step.config.emits, ...(step.config.virtualEmits ?? [])],
          subscribes: step.config.subscribes,
          language: getStepLanguage(step.filePath),
          nodeComponentPath,
        })
      } else if (isNoopStep(step)) {
        steps.push({
          id: randomUUID(),
          type: 'noop',
          name: step.config.name,
          description: step.config.description,
          emits: step.config.virtualEmits,
          subscribes: step.config.virtualSubscribes,
          nodeComponentPath,
        })
      }
    })

    list.push({ id: flowId, name: flowId, steps })
  })

  return list
}

export const flowsEndpoint = (flows: LockedData['flows'], app: Express) => {
  const list = generateFlowsList(flows)

  app.get('/flows', async (_, res) => {
    res.status(200).send(list.map(({ id, name }) => ({ id, name })))
  })

  app.get('/flows/:id', async (req, res) => {
    const { id } = req.params as { id: string }
    const flow: FlowListResponse | undefined = list.find((flow) => flow.id === id)

    if (!flow) {
      res.status(404).send({ error: 'Flow not found' })
    } else {
      res.status(200).send(flow)
    }
  })
}
