import { applyMiddleware } from '@wistro/ui/middleware'
import bodyParser from 'body-parser'
import { randomUUID } from 'crypto'
import express, { Request, Response } from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { StateAdapter } from '../state/StateAdapter'
import {
  ApiRequest,
  ApiRouteHandler,
  EmitData,
  EventManager,
  LockFile,
  WistroServer,
  WistroSockerServer,
} from './../wistro.types'
import { Step } from './config.types'
import { flowsEndpoint, generateFlowsList } from './flows-endpoint'
import { isApiStep, isNoopStep } from './guards'
import { globalLogger, Logger } from './logger'

export const createServer = async (
  lockData: LockFile,
  steps: Step[],
  state: StateAdapter,
  eventManager: EventManager,
  options?: {
    skipSocketServer?: boolean
  },
): Promise<{ server: WistroServer; socketServer?: WistroSockerServer }> => {
  const app = express()
  const server = http.createServer(app)
  let io: SocketIOServer | undefined

  if (!options?.skipSocketServer) {
    globalLogger.debug('[API] Creating socket server')
    io = new SocketIOServer(server)
  }

  const asyncHandler = (step: Step, flows: string[]) => {
    return async (req: Request, res: Response) => {
      const traceId = randomUUID()
      const logger = new Logger(traceId, flows, step.file, io)
      const module = require(step.filePath)
      const handler = module.handler as ApiRouteHandler
      const request: ApiRequest = {
        body: req.body,
        headers: req.headers as Record<string, string | string[]>,
        pathParams: req.params,
        queryParams: req.query as Record<string, string | string[]>,
      }
      const emit = async (event: EmitData) => {
        await eventManager.emit(
          {
            data: event.data,
            type: event.type,
            traceId,
            flows,
            logger,
          },
          step.filePath,
        )
      }

      try {
        const result = await handler(request, { emit, state, logger, traceId })

        if (result.headers) {
          Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value))
        }

        res.status(result.status)
        res.json(result.body)
      } catch (error) {
        logger.error('[API] Internal server error', { error })
        console.log(error)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  const apiSteps = steps.filter(isApiStep)

  for (const step of apiSteps) {
    const { method, flows, path } = step.config

    globalLogger.debug('[API] Registering route', step.config)

    // if (step.config.virtualSubscribes) {
    //   for (const subscribe of step.config.virtualSubscribes) {
    //     const { type, path } = subscribe
    //     app.post(path, asyncHandler(step, flows))
    //   }
    // }

    if (method === 'POST') {
      app.post(path, asyncHandler(step, flows))
    } else if (method === 'GET') {
      app.get(path, asyncHandler(step, flows))
    } else {
      throw new Error(`Unsupported method: ${method}`)
    }
  }

  const list = generateFlowsList(steps)

  flowsEndpoint(list, app)

  app.post('/emit/:flowId', async (req, res) => {
    const body: { stepId: string; data: Record<string, unknown> } = req.body
    const { data, stepId } = body
    const flowId = req.params.flowId
    const flows = [flowId]
    const traceId = randomUUID()
    const step = list.find((flow) => flow.id === flowId)?.steps.find((step) => step.id === stepId)
    const logger = new Logger(traceId, flows, stepId, io)

    if (step && isNoopStep(step.step)) {
      const emit = step.step.config.virtualEmit
      const emitType = typeof emit === 'string' ? emit : emit.type

      await eventManager.emit({ data, type: emitType, traceId, flows: [flowId], logger }, step.step.filePath)

      res.status(200).json({ ok: true })
    } else {
      res.status(404).json({ error: 'Step not found' })
    }
  })

  await applyMiddleware(app)

  globalLogger.debug('[API] Server listening on port', lockData.port)

  server.listen(lockData.port)

  return { server, socketServer: io }
}
