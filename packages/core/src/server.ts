import { setupCronHandlers } from './cron-handler'
import bodyParser from 'body-parser'
import { randomUUID } from 'crypto'
import express, { Express, Request, Response } from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { flowsEndpoint } from './flows-endpoint'
import { isApiStep } from './guards'
import { globalLogger, Logger } from './logger'
import { StateAdapter } from './state/state-adapter'
import { ApiRequest, ApiRouteHandler, EmitData, EventManager, LockedData, Step } from './types'
import { getModuleExport } from './node/get-module-export'
import { systemSteps } from './steps'

type ServerOptions = {
  steps: Step[]
  flows: LockedData['flows']
  eventManager: EventManager
  state: StateAdapter
}

type ServerOutput = {
  app: Express
  server: http.Server
  socketServer: SocketIOServer
  close: () => Promise<void>
}

export const createServer = async (options: ServerOptions): Promise<ServerOutput> => {
  const { flows, steps, eventManager, state } = options
  const app = express()
  const server = http.createServer(app)
  const io = new SocketIOServer(server)

  const allSteps = [...systemSteps, ...steps]

  const cleanupCronJobs = setupCronHandlers(allSteps, eventManager, io)

  const asyncHandler = (step: Step) => {
    return async (req: Request, res: Response) => {
      const traceId = randomUUID()

      const logger = new Logger(traceId, step.config.flows, step.config.name, io)

      logger.debug('[API] Received request, processing step', { path: req.path, step })

      const handler = (await getModuleExport(step.filePath, 'handler')) as ApiRouteHandler
      const request: ApiRequest = {
        body: req.body,
        headers: req.headers as Record<string, string | string[]>,
        pathParams: req.params,
        queryParams: req.query as Record<string, string | string[]>,
      }
      const emit = async ({ data, type }: EmitData) => {
        await eventManager.emit({ data, type, traceId, flows: step.config.flows, logger }, step.filePath)
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

  const apiSteps = allSteps.filter(isApiStep)

  for (const step of apiSteps) {
    const { method, path } = step.config
    globalLogger.debug('[API] Registering route', step.config)

    if (method === 'POST') {
      app.post(path, asyncHandler(step))
    } else if (method === 'GET') {
      app.get(path, asyncHandler(step))
    } else {
      throw new Error(`Unsupported method: ${method}`)
    }
  }

  flowsEndpoint(flows, app)

  server.on('error', (error) => {
    console.error('Server error:', error)
    cleanupCronJobs()
  })

  const close = async (): Promise<void> => {
    cleanupCronJobs()
    await io.close()
    server.close()
  }

  return { app, server, socketServer: io, close }
}