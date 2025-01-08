import { applyMiddleware } from '@wistro/ui'
import { Server as SocketIOServer } from 'socket.io'
import bodyParser from 'body-parser'
import { randomUUID } from 'crypto'
import express, { Request, Response } from 'express'
import http from 'http'
import { Config, WorkflowStep } from './config.types'
import { Event, EventManager } from './event-manager'
import { workflowsEndpoint } from './workflows-endpoint'
import { globalLogger, Logger } from './logger'

export const createServer = async (config: Config, workflowSteps: WorkflowStep[], eventManager: EventManager) => {
  const app = express()
  const server = http.createServer(app)
  const io = new SocketIOServer(server)

  globalLogger.debug('[API] Registering routes', { paths: config.api.paths })

  const asyncHandler = (emits: string, workflowId: string) => {
    return async (req: Request, res: Response) => {
      const traceId = randomUUID()
      const logger = new Logger(traceId, workflowId, io)
      const event: Omit<Event<unknown>, 'logger'> = {
        traceId,
        workflowId,
        type: emits,
        data: req.body,
      }

      globalLogger.debug('[API] Request received', { event })

      try {
        await eventManager.emit({ ...event, logger })
        res.send({ success: true, eventType: emits, traceId })
      } catch (error) {
        console.error('[API] Error emitting event', error)
        res.status(500).send({ error: 'Internal server error' })
      }
    }
  }

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  for (const path in config.api.paths) {
    const { method, emits, workflow } = config.api.paths[path]

    globalLogger.debug('[API] Registering route', { method, path, emits })

    if (method === 'POST') {
      app.post(path, asyncHandler(emits, workflow))
    } else if (method === 'GET') {
      app.get(path, asyncHandler(emits, workflow))
    } else {
      throw new Error(`Unsupported method: ${method}`)
    }
  }

  workflowsEndpoint(config, workflowSteps, app)
  await applyMiddleware(app)

  globalLogger.debug('[API] Server listening on port', config.port)

  server.listen(config.port)

  return { server, socketServer: io }
}
